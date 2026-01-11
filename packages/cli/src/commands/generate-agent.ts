import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { logger } from '@neural-tools/core';
import inquirer from 'inquirer';

interface GenerateAgentOptions {
  description?: string;
  output?: string;
  model?: 'sonnet' | 'opus' | 'haiku';
  tools?: string[];
  global?: boolean;
  dryRun?: boolean;
}

export async function generateAgent(name: string, options: GenerateAgentOptions): Promise<void> {
  logger.header(`Generating Claude Agent: ${name}`);

  // Prompt for missing information
  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of your agent:',
        default: `${name} specialized agent`
      }
    ]);
    description = answers.description;
  }

  // Determine output directory
  let outputDir: string;
  if (options.global) {
    outputDir = path.join(os.homedir(), '.claude', 'agents');
  } else {
    outputDir = path.resolve(options.output || './claude/agents');
  }

  const agentFile = path.join(outputDir, `${name}.md`);
  const model = options.model || 'sonnet';

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: ${name}`,
      `Description: ${description}`,
      `Output: ${agentFile}`,
      `Model: ${model}`,
      `Tools: ${options.tools?.join(', ') || 'all'}`,
      `Global: ${options.global ? 'Yes' : 'No'}`
    ]);
    return;
  }

  // Check if file already exists
  if (await fs.pathExists(agentFile)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Agent ${name} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }
  }

  logger.startSpinner('Creating Claude agent...');

  try {
    await fs.ensureDir(outputDir);

    // Build frontmatter
    const frontmatter: string[] = ['---'];
    frontmatter.push(`model: claude-${model}-4-5`);

    if (options.tools && options.tools.length > 0) {
      frontmatter.push(`tools:`);
      options.tools.forEach(tool => {
        frontmatter.push(`  - ${tool}`);
      });
    }

    frontmatter.push('---');
    frontmatter.push('');

    // Build agent content
    const agentContent = `${frontmatter.join('\n')}# ${name} Agent

${description}

## Role

You are a specialized agent for ${name} tasks. Your primary responsibilities include:

- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

## Guidelines

When performing ${name} tasks:

1. [Guideline 1]
2. [Guideline 2]
3. [Guideline 3]

## Output Format

Provide clear, structured responses that:
- [Output requirement 1]
- [Output requirement 2]
- [Output requirement 3]

Focus on ${name} and deliver actionable results.
`;

    await fs.writeFile(agentFile, agentContent, 'utf-8');

    logger.succeedSpinner('Claude agent created successfully!');

    logger.section('Next steps', [
      options.global
        ? `Agent ${name} is now available globally in Claude Code`
        : `Add the agent to your project by copying ${agentFile}`,
      '',
      'Customize the agent by editing:',
      `  ${agentFile}`,
      '',
      'Use the agent via the Task tool in Claude Code'
    ]);

    logger.success(`✨ Agent "${name}" ready to use!`);
  } catch (error: any) {
    logger.failSpinner('Failed to create agent');
    throw error;
  }
}
