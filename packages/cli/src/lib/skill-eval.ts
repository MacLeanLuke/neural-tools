/**
 * Skill evaluation primitives.
 *
 * A skill is selected by its description — the model reads descriptions and
 * decides which to load. That makes the description the highest-risk part of a
 * skill and the part nobody tests. These functions split the problem in two:
 *
 *   lintSkill()     deterministic contract checks, no model, no network
 *   scoreTriggers() deterministic scoring of selection outcomes
 *
 * Selection itself is inherently model-driven, so the model stays inside the
 * system under test and never inside the scorer.
 */

export interface Frontmatter {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: Frontmatter;
  body: string;
  hasFrontmatter: boolean;
}

export type Severity = 'error' | 'warning';

export interface Finding {
  severity: Severity;
  rule: string;
  message: string;
}

/** Template text emitted by `generate skill`; its presence means nobody edited the file. */
const TEMPLATE_MARKER = 'Use this skill when the request matches';

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Minimal frontmatter reader. Deliberately not a full YAML parser — skills use
 * flat `key: value` pairs, and pulling in a YAML dependency to read two fields
 * would be the wrong trade for a CLI people install globally.
 */
export function parseSkillFile(content: string): ParsedSkill {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized);

  if (!match) {
    return { frontmatter: {}, body: normalized.trim(), hasFrontmatter: false };
  }

  const frontmatter: Frontmatter = {};
  for (const line of match[1]!.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    if (key) frontmatter[key] = value;
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length).trim(),
    hasFrontmatter: true,
  };
}

export interface LintOptions {
  content: string;
  /** Directory the SKILL.md lives in — must match the frontmatter name. */
  dirName: string;
  /** Whether an evals/triggers.json sits alongside the skill. */
  hasTriggerFixtures?: boolean;
}

export function lintSkill({ content, dirName, hasTriggerFixtures = false }: LintOptions): Finding[] {
  const findings: Finding[] = [];
  const error = (rule: string, message: string) => findings.push({ severity: 'error', rule, message });
  const warn = (rule: string, message: string) => findings.push({ severity: 'warning', rule, message });

  const { frontmatter, body, hasFrontmatter } = parseSkillFile(content);

  if (!hasFrontmatter) {
    error('frontmatter-missing', 'SKILL.md has no --- frontmatter block. The skill cannot be registered.');
    return findings;
  }

  const name = typeof frontmatter.name === 'string' ? frontmatter.name.trim() : '';
  const description = typeof frontmatter.description === 'string' ? frontmatter.description.trim() : '';

  if (!name) {
    error('name-missing', 'Frontmatter has no "name".');
  } else {
    if (name !== dirName) {
      error('name-mismatch', `Frontmatter name "${name}" does not match directory "${dirName}".`);
    }
    if (!KEBAB_CASE.test(name)) {
      warn('name-not-kebab', `"${name}" is not kebab-case, which is the convention for skill names.`);
    }
  }

  if (!description) {
    error('description-missing', 'Frontmatter has no "description". Without it the skill can never be selected.');
  } else {
    if (description.length < 20) {
      error(
        'description-too-short',
        `Description is ${description.length} characters. Too vague to distinguish this skill from any other.`,
      );
    }
    if (description.length > 1024) {
      warn('description-too-long', `Description is ${description.length} characters and risks truncation in listings.`);
    }
    if (!/\bwhen\b|\buse (this|it)\b|\btrigger/i.test(description)) {
      warn(
        'description-no-trigger',
        'Description does not say *when* to use the skill. Selection depends on this — state the situations that should invoke it.',
      );
    }
  }

  if (body.includes(TEMPLATE_MARKER)) {
    warn('body-is-template', 'Body still contains generated template text. Replace it with the real workflow.');
  }

  if (body.length < 200) {
    warn('body-too-short', `Body is ${body.length} characters — likely a stub rather than a usable skill.`);
  }

  if (!hasTriggerFixtures) {
    warn(
      'no-trigger-fixtures',
      'No evals/triggers.json. Without labeled prompts there is no way to tell whether this skill actually gets selected.',
    );
  }

  return findings;
}

export interface TriggerCase {
  prompt: string;
  shouldTrigger: boolean;
}

export interface TriggerOutcome extends TriggerCase {
  didTrigger: boolean;
}

export interface TriggerScore {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

/**
 * Precision matters more than recall here. A skill that fires when it shouldn't
 * hijacks unrelated requests, which is far more damaging than one that
 * occasionally fails to fire.
 */
export function scoreTriggers(outcomes: TriggerOutcome[]): TriggerScore {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;

  for (const outcome of outcomes) {
    if (outcome.shouldTrigger && outcome.didTrigger) truePositives += 1;
    else if (!outcome.shouldTrigger && outcome.didTrigger) falsePositives += 1;
    else if (outcome.shouldTrigger && !outcome.didTrigger) falseNegatives += 1;
    else trueNegatives += 1;
  }

  const precision = truePositives + falsePositives === 0 ? 1 : truePositives / (truePositives + falsePositives);
  const recall = truePositives + falseNegatives === 0 ? 1 : truePositives / (truePositives + falseNegatives);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const total = outcomes.length;
  const accuracy = total === 0 ? 0 : (truePositives + trueNegatives) / total;

  return { truePositives, falsePositives, falseNegatives, trueNegatives, precision, recall, f1, accuracy };
}

export function parseTriggerFixtures(raw: unknown): TriggerCase[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('triggers.json must be an object with "should_trigger" and "should_not_trigger" arrays.');
  }

  const source = raw as Record<string, unknown>;
  const positives = source.should_trigger;
  const negatives = source.should_not_trigger;

  if (!Array.isArray(positives) || !Array.isArray(negatives)) {
    throw new Error('triggers.json must contain "should_trigger" and "should_not_trigger" arrays.');
  }

  const cases: TriggerCase[] = [];
  for (const prompt of positives) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Every should_trigger entry must be a non-empty string.');
    cases.push({ prompt: prompt.trim(), shouldTrigger: true });
  }
  for (const prompt of negatives) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Every should_not_trigger entry must be a non-empty string.');
    cases.push({ prompt: prompt.trim(), shouldTrigger: false });
  }

  if (cases.length === 0) {
    throw new Error('triggers.json contains no cases.');
  }

  return cases;
}

export function hasErrors(findings: Finding[]): boolean {
  return findings.some((finding) => finding.severity === 'error');
}
