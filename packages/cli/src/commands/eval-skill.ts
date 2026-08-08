import path from 'path';
import fs from 'fs-extra';
import pc from 'picocolors';
import { logger } from '@neural-tools/core';
import { hasErrors, lintSkill, parseTriggerFixtures, type Finding } from '../lib/skill-eval';

interface EvalSkillOptions {
  strict?: boolean;
  json?: boolean;
}

interface SkillReport {
  skill: string;
  path: string;
  findings: Finding[];
  triggerCases: number | null;
  triggerError: string | null;
}

/**
 * Checks a skill against the contract that decides whether it will ever be
 * selected: valid frontmatter, a name matching its directory, and a description
 * specific enough to distinguish it from every other skill installed.
 *
 * Entirely offline and deterministic — no model, no network, no API key.
 */
export async function evalSkill(target: string, options: EvalSkillOptions): Promise<void> {
  const resolved = path.resolve(target);
  const reports: SkillReport[] = [];

  const directories = (await isSkillDirectory(resolved))
    ? [resolved]
    : await findSkillDirectories(resolved);

  if (directories.length === 0) {
    logger.error(`No SKILL.md found in ${resolved} or any immediate subdirectory.`);
    process.exitCode = 2;
    return;
  }

  for (const dir of directories) {
    reports.push(await evaluateOne(dir));
  }

  if (options.json) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    printReports(reports, Boolean(options.strict));
  }

  const failed = reports.some(
    (report) => hasErrors(report.findings) || report.triggerError !== null || (options.strict && report.findings.length > 0),
  );

  if (failed) process.exitCode = 1;
}

async function isSkillDirectory(dir: string): Promise<boolean> {
  return fs.pathExists(path.join(dir, 'SKILL.md'));
}

async function findSkillDirectories(root: string): Promise<string[]> {
  if (!(await fs.pathExists(root))) return [];

  const entries = await fs.readdir(root, { withFileTypes: true });
  const found: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(root, entry.name);
    if (await isSkillDirectory(candidate)) found.push(candidate);
  }

  return found.sort();
}

async function evaluateOne(dir: string): Promise<SkillReport> {
  const content = await fs.readFile(path.join(dir, 'SKILL.md'), 'utf-8');
  const triggersPath = path.join(dir, 'evals', 'triggers.json');
  const hasTriggerFixtures = await fs.pathExists(triggersPath);

  let triggerCases: number | null = null;
  let triggerError: string | null = null;

  if (hasTriggerFixtures) {
    try {
      const raw = JSON.parse(await fs.readFile(triggersPath, 'utf-8'));
      triggerCases = parseTriggerFixtures(raw).length;
    } catch (error: any) {
      triggerError = error?.message ?? String(error);
    }
  }

  return {
    skill: path.basename(dir),
    path: dir,
    findings: lintSkill({ content, dirName: path.basename(dir), hasTriggerFixtures }),
    triggerCases,
    triggerError,
  };
}

function printReports(reports: SkillReport[], strict: boolean): void {
  let errorCount = 0;
  let warningCount = 0;

  for (const report of reports) {
    const errors = report.findings.filter((f) => f.severity === 'error');
    const warnings = report.findings.filter((f) => f.severity === 'warning');
    // An unreadable triggers.json is an error too, even though it is not a lint finding.
    errorCount += errors.length + (report.triggerError ? 1 : 0);
    warningCount += warnings.length;

    const clean = report.findings.length === 0 && !report.triggerError;
    const badge = clean ? pc.green('PASS') : errors.length > 0 || report.triggerError ? pc.red('FAIL') : pc.yellow('WARN');

    console.log(`\n${badge}  ${pc.bold(report.skill)}`);

    if (report.triggerCases !== null) {
      console.log(`      ${pc.dim(`${report.triggerCases} trigger cases labeled`)}`);
    }

    if (report.triggerError) {
      console.log(`      ${pc.red('✗')} evals/triggers.json: ${report.triggerError}`);
    }

    for (const finding of report.findings) {
      const mark = finding.severity === 'error' ? pc.red('✗') : pc.yellow('!');
      console.log(`      ${mark} ${pc.dim(finding.rule)}  ${finding.message}`);
    }
  }

  console.log('');
  console.log(
    `${reports.length} skill${reports.length === 1 ? '' : 's'} checked — ` +
      `${errorCount} error${errorCount === 1 ? '' : 's'}, ${warningCount} warning${warningCount === 1 ? '' : 's'}`,
  );
  if (strict && warningCount > 0) {
    console.log(pc.yellow('--strict is on, so warnings fail the run.'));
  }
  console.log('');
}
