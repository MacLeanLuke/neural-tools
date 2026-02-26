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

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: ${name}`,
      `Description: ${description}`,
      `Output: ${skillFile}`,
      `Plugin: ${options.plugin || 'none'}`,
      `References: ${options.references ? 'Yes' : 'No'}`,
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

    logger.succeedSpinner('Claude skill created successfully!');
    logger.section('Next steps', [
      `Edit the skill definition: ${skillFile}`,
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
