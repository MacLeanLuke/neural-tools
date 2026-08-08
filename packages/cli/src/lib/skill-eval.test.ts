import { describe, expect, it } from 'vitest';
import {
  hasErrors,
  lintSkill,
  parseSkillFile,
  parseTriggerFixtures,
  scoreTriggers,
  type TriggerOutcome,
} from './skill-eval';

const goodSkill = `---
name: pdf-invoice-parser
description: Extracts line items, totals, and vendor details from PDF invoices. Use this when the user uploads an invoice, asks to pull totals out of a receipt, or mentions accounts payable processing.
---

# PDF invoice parser

Pulls structured data out of vendor invoices so they can be reconciled against
purchase orders without manual entry.

## Workflow

1. Read the uploaded PDF and extract raw text.
2. Identify the vendor block, line items, subtotal, tax, and total.
3. Validate that line items sum to the subtotal before returning anything.
4. If validation fails, report the discrepancy rather than guessing.

## Output

Return a table of line items followed by the reconciled totals.
`;

const rule = (findings: ReturnType<typeof lintSkill>, name: string) => findings.find((f) => f.rule === name);

describe('parseSkillFile', () => {
  it('reads name and description from frontmatter', () => {
    const parsed = parseSkillFile(goodSkill);
    expect(parsed.hasFrontmatter).toBe(true);
    expect(parsed.frontmatter.name).toBe('pdf-invoice-parser');
    expect(parsed.frontmatter.description).toContain('Extracts line items');
  });

  it('keeps colons inside a description intact', () => {
    const parsed = parseSkillFile('---\nname: a\ndescription: Use when: totals differ\n---\n\nbody\n');
    expect(parsed.frontmatter.description).toBe('Use when: totals differ');
  });

  it('strips surrounding quotes', () => {
    const parsed = parseSkillFile('---\nname: "quoted-name"\n---\n\nbody\n');
    expect(parsed.frontmatter.name).toBe('quoted-name');
  });

  it('handles CRLF line endings', () => {
    const parsed = parseSkillFile('---\r\nname: crlf\r\n---\r\n\r\nbody\r\n');
    expect(parsed.frontmatter.name).toBe('crlf');
  });

  it('reports a file with no frontmatter', () => {
    const parsed = parseSkillFile('# Just a heading\n');
    expect(parsed.hasFrontmatter).toBe(false);
    expect(parsed.frontmatter).toEqual({});
  });
});

describe('lintSkill', () => {
  it('passes a well-formed skill that has fixtures', () => {
    const findings = lintSkill({ content: goodSkill, dirName: 'pdf-invoice-parser', hasTriggerFixtures: true });
    expect(findings).toEqual([]);
  });

  it('errors when frontmatter is missing entirely', () => {
    const findings = lintSkill({ content: '# no frontmatter', dirName: 'x' });
    expect(rule(findings, 'frontmatter-missing')).toBeDefined();
    expect(hasErrors(findings)).toBe(true);
  });

  it('errors when the name does not match the directory', () => {
    const findings = lintSkill({ content: goodSkill, dirName: 'something-else', hasTriggerFixtures: true });
    expect(rule(findings, 'name-mismatch')).toBeDefined();
  });

  it('errors on a missing description, since selection depends on it', () => {
    const content = '---\nname: thing\n---\n\n' + 'x'.repeat(300);
    const findings = lintSkill({ content, dirName: 'thing', hasTriggerFixtures: true });
    expect(rule(findings, 'description-missing')?.severity).toBe('error');
  });

  it('errors on a description too short to disambiguate', () => {
    const content = '---\nname: thing\ndescription: does stuff\n---\n\n' + 'x'.repeat(300);
    const findings = lintSkill({ content, dirName: 'thing', hasTriggerFixtures: true });
    expect(rule(findings, 'description-too-short')?.severity).toBe('error');
  });

  it('warns when the description never says when to use the skill', () => {
    const content =
      '---\nname: thing\ndescription: A general purpose helper for various assorted tasks and operations.\n---\n\n' +
      'x'.repeat(300);
    const findings = lintSkill({ content, dirName: 'thing', hasTriggerFixtures: true });
    expect(rule(findings, 'description-no-trigger')?.severity).toBe('warning');
  });

  it('warns when the body is still generated template text', () => {
    const content =
      '---\nname: thing\ndescription: Use this when the user needs a thing done properly and carefully.\n---\n\n' +
      'Use this skill when the request matches thing workflows.\n' +
      'x'.repeat(300);
    const findings = lintSkill({ content, dirName: 'thing', hasTriggerFixtures: true });
    expect(rule(findings, 'body-is-template')).toBeDefined();
  });

  it('warns when no trigger fixtures exist', () => {
    const findings = lintSkill({ content: goodSkill, dirName: 'pdf-invoice-parser' });
    expect(rule(findings, 'no-trigger-fixtures')?.severity).toBe('warning');
    expect(hasErrors(findings)).toBe(false);
  });

  it('warns on a non-kebab-case name without failing', () => {
    const content = goodSkill.replace('name: pdf-invoice-parser', 'name: PDF_Invoice_Parser');
    const findings = lintSkill({ content, dirName: 'PDF_Invoice_Parser', hasTriggerFixtures: true });
    expect(rule(findings, 'name-not-kebab')?.severity).toBe('warning');
  });
});

describe('scoreTriggers', () => {
  const outcome = (shouldTrigger: boolean, didTrigger: boolean): TriggerOutcome => ({
    prompt: 'p',
    shouldTrigger,
    didTrigger,
  });

  it('scores a perfect run as 1', () => {
    const score = scoreTriggers([outcome(true, true), outcome(false, false)]);
    expect(score.f1).toBe(1);
    expect(score.accuracy).toBe(1);
  });

  it('punishes a skill that fires when it should not', () => {
    const score = scoreTriggers([outcome(true, true), outcome(false, true)]);
    expect(score.precision).toBe(0.5);
    expect(score.falsePositives).toBe(1);
  });

  it('punishes a skill that fails to fire', () => {
    const score = scoreTriggers([outcome(true, false), outcome(false, false)]);
    expect(score.recall).toBe(0);
    expect(score.falseNegatives).toBe(1);
  });

  it('returns 0 accuracy for an empty run rather than dividing by zero', () => {
    expect(scoreTriggers([]).accuracy).toBe(0);
  });
});

describe('parseTriggerFixtures', () => {
  it('flattens both arrays into labeled cases', () => {
    const cases = parseTriggerFixtures({
      should_trigger: ['parse this invoice'],
      should_not_trigger: ['what is the weather'],
    });
    expect(cases).toHaveLength(2);
    expect(cases[0]).toEqual({ prompt: 'parse this invoice', shouldTrigger: true });
    expect(cases[1]!.shouldTrigger).toBe(false);
  });

  it('rejects a file missing either array', () => {
    expect(() => parseTriggerFixtures({ should_trigger: ['a'] })).toThrow(/should_not_trigger/);
  });

  it('rejects an empty fixture set', () => {
    expect(() => parseTriggerFixtures({ should_trigger: [], should_not_trigger: [] })).toThrow(/no cases/);
  });

  it('rejects non-string entries', () => {
    expect(() => parseTriggerFixtures({ should_trigger: [42], should_not_trigger: [] })).toThrow(/non-empty string/);
  });
});
