import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { logger } from '@neural-tools/core';

interface GeneratePluginOptions {
  description?: string;
  output?: string;
  version?: string;
  author?: string;
  withSkill?: string;
  dryRun?: boolean;
}

interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
}

export async function generatePlugin(name: string, options: GeneratePluginOptions): Promise<void> {
  logger.header(`Generating Claude Plugin: ${name}`);

  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of your plugin:',
        default: `${name} Claude Code plugin`
      }
    ]);
    description = answers.description;
  }

  const pluginDir = path.resolve(options.output || './claude/plugins', name);
  const pluginConfigDir = path.join(pluginDir, '.claude-plugin');
  const pluginConfigFile = path.join(pluginConfigDir, 'plugin.json');
  const skillsDir = path.join(pluginDir, 'skills');

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: ${name}`,
      `Description: ${description}`,
      `Output: ${pluginDir}`,
      `Plugin config: ${pluginConfigFile}`,
      `Version: ${options.version || '0.1.0'}`,
      `Author: ${options.author || 'none'}`,
      `Starter skill: ${options.withSkill || 'none'}`
    ]);
    return;
  }

  if (await fs.pathExists(pluginConfigFile)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Plugin ${name} already exists. Overwrite config?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }
  }

  logger.startSpinner('Creating Claude plugin...');

  try {
    await fs.ensureDir(pluginConfigDir);
    await fs.ensureDir(skillsDir);

    const manifest: PluginManifest = {
      name,
      version: options.version || '0.1.0',
      description
    };

    if (options.author) {
      manifest.author = options.author;
    }

    await fs.writeJSON(pluginConfigFile, manifest, { spaces: 2 });

    if (options.withSkill) {
      const starterSkillDir = path.join(skillsDir, options.withSkill);
      const starterSkillFile = path.join(starterSkillDir, 'SKILL.md');
      await fs.ensureDir(starterSkillDir);

      const starterSkill = `---
name: ${options.withSkill}
description: Starter skill for ${name}
---

# ${options.withSkill}

Starter skill scaffolded with the plugin.
`;
      await fs.writeFile(starterSkillFile, starterSkill, 'utf-8');
    }

    logger.succeedSpinner('Claude plugin created successfully!');
    logger.section('Next steps', [
      `Review plugin manifest: ${pluginConfigFile}`,
      options.withSkill
        ? `Customize skill: ${path.join(skillsDir, options.withSkill, 'SKILL.md')}`
        : 'Use `generate skill <name> --plugin <plugin-dir>` to add skills',
      `Install with Claude Code using the plugin path: ${pluginDir}`
    ]);
    logger.success(`✨ Plugin "${name}" ready to use!`);
  } catch (error: any) {
    logger.failSpinner('Failed to create plugin');
    throw error;
  }
}
