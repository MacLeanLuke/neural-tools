import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { logger } from '@neural-tools/core';

interface GenerateSkillOptions {
  description?: string;
  output?: string;
  plugin?: string;
  references?: boolean;
  noEvals?: boolean;
  global?: boolean;
  dryRun?: boolean;
}

export async function generateSkill(name: string, options: GenerateSkillOptions): Promise<void> {
  logger.header(`Generating Claude Skill: ${name}`);

  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of your skill:',
        default: `${name} skill for Claude Code`
      }
    ]);
    description = answers.description;
  }

  const baseDir = resolveBaseDir(options);
  const skillDir = path.join(baseDir, name);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const referencesDir = path.join(skillDir, 'references');
  const evalsDir = path.join(skillDir, 'evals');

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: ${name}`,
      `Description: ${description}`,
      `Output: ${skillFile}`,
      `Plugin: ${options.plugin || 'none'}`,
      `References: ${options.references ? 'Yes' : 'No'}`,
      `Evals: ${options.noEvals ? 'No' : 'Yes'}`,
      `Global: ${options.global ? 'Yes' : 'No'}`
    ]);
    return;
  }

  if (await fs.pathExists(skillFile)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Skill ${name} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }
  }

  logger.startSpinner('Creating Claude skill...');

  try {
    await fs.ensureDir(skillDir);
    if (options.references) {
      await fs.ensureDir(referencesDir);
    }

    const skillContent = `---
name: ${name}
description: ${description}
---

# ${name}

${description}

## When to use this skill

Use this skill when the request matches ${name} workflows.

## Workflow

1. Gather the relevant project context.
2. Apply ${name} specific checks and implementation steps.
3. Return concrete output and next actions.
`;

    await fs.writeFile(skillFile, skillContent, 'utf-8');

    if (options.references) {
      const referencesReadme = `# References

Store focused reference material for the ${name} skill in this folder.
`;
      await fs.writeFile(path.join(referencesDir, 'README.md'), referencesReadme, 'utf-8');
    }

    // Scaffolded by default. A skill is chosen by its description, so the
    // description is the highest-risk part of it — and the part that goes
    // untested unless the labeled prompts exist from the start.
    if (!options.noEvals) {
      await fs.ensureDir(evalsDir);
      const triggers = {
        should_trigger: [
          `Replace with a request that must select "${name}".`,
          `Add another phrasing a real user would type.`
        ],
        should_not_trigger: [
          `Replace with a nearby request that must NOT select "${name}".`,
          `Add a request another skill should win instead.`
        ]
      };
      await fs.writeFile(
        path.join(evalsDir, 'triggers.json'),
        `${JSON.stringify(triggers, null, 2)}\n`,
        'utf-8'
      );
    }

    logger.succeedSpinner('Claude skill created successfully!');
    logger.section('Next steps', [
      `Edit the skill definition: ${skillFile}`,
      options.noEvals
        ? 'Add evals/triggers.json so selection can be measured'
        : `Replace the placeholder prompts in: ${path.join(evalsDir, 'triggers.json')}`,
      `Check it: neural-tools eval skill ${skillDir}`,
      options.references ? `Add reference docs in: ${referencesDir}` : 'Use --references to scaffold a references folder'
    ]);
    logger.success(`✨ Skill "${name}" ready to use!`);
  } catch (error: any) {
    logger.failSpinner('Failed to create skill');
    throw error;
  }
}

function resolveBaseDir(options: GenerateSkillOptions): string {
  if (options.plugin) {
    return path.resolve(options.plugin, 'skills');
  }

  if (options.global) {
    return path.join(os.homedir(), '.claude', 'skills');
  }

  return path.resolve(options.output || './claude/skills');
}
