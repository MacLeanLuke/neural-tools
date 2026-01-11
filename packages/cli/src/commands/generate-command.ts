import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { logger } from '@ai-toolkit/core';
import inquirer from 'inquirer';

interface GenerateCommandOptions {
  description?: string;
  output?: string;
  args?: string[];
  tools?: string[];
  global?: boolean;
  dryRun?: boolean;
}

export async function generateCommand(name: string, options: GenerateCommandOptions): Promise<void> {
  logger.header(`Generating Claude Command: /${name}`);

  // Prompt for missing information
  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of your command:',
        default: `Execute ${name}`
      }
    ]);
    description = answers.description;
  }

  // Determine output directory
  let outputDir: string;
  if (options.global) {
    outputDir = path.join(os.homedir(), '.claude', 'commands');
  } else {
    outputDir = path.resolve(options.output || './claude/commands');
  }

  const commandFile = path.join(outputDir, `${name}.md`);

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: /${name}`,
      `Description: ${description}`,
      `Output: ${commandFile}`,
      `Arguments: ${options.args?.join(', ') || 'none'}`,
      `Allowed Tools: ${options.tools?.join(', ') || 'all'}`,
      `Global: ${options.global ? 'Yes' : 'No'}`
    ]);
    return;
  }

  // Check if file already exists
  if (await fs.pathExists(commandFile)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Command /${name} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }
  }

  logger.startSpinner('Creating Claude command...');

  try {
    await fs.ensureDir(outputDir);

    // Build frontmatter
    const frontmatter: string[] = ['---'];

    if (options.args && options.args.length > 0) {
      frontmatter.push(`argument-hint: ${options.args.join(' ')}`);
    }

    frontmatter.push(`description: ${description}`);

    if (options.tools && options.tools.length > 0) {
      frontmatter.push(`allowed-tools:`);
      options.tools.forEach(tool => {
        frontmatter.push(`  - ${tool}`);
      });
    }

    frontmatter.push('---');
    frontmatter.push('');

    // Build command content
    const argsList = options.args || [];
    const argPlaceholders = argsList.map((arg, i) => `$${i + 1}`).join(' ');
    const argDescription = argsList.length > 0
      ? `\n\nArguments:\n${argsList.map((arg, i) => `- $${i + 1}: ${arg}`).join('\n')}`
      : '';

    const commandContent = `${frontmatter.join('\n')}# ${name} Command

Execute the ${name} operation${argDescription ? ':' + argDescription : '.'}

${argPlaceholders ? `Using arguments: ${argPlaceholders}` : ''}

Please proceed with the ${name} operation.
`;

    await fs.writeFile(commandFile, commandContent, 'utf-8');

    logger.succeedSpinner('Claude command created successfully!');

    logger.section('Next steps', [
      options.global
        ? `Command /${name} is now available globally in Claude Code`
        : `Add the command to your project by copying ${commandFile}`,
      '',
      'Usage:',
      argsList.length > 0
        ? `  /${name} ${argsList.join(' ')}`
        : `  /${name}`
    ]);

    logger.success(`✨ Command "/${name}" ready to use!`);
  } catch (error: any) {
    logger.failSpinner('Failed to create command');
    throw error;
  }
}
