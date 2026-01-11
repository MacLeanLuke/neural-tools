#!/usr/bin/env node

import { Command } from 'commander';
import { logger } from '@ai-toolkit/core';
import { generateMCP } from './commands/generate-mcp';
import { generateCommand } from './commands/generate-command';
import { generateAgent } from './commands/generate-agent';
import { deployMCP } from './commands/deploy';
import { loginCommand } from './commands/login';
import { statusCommand } from './commands/status';

const program = new Command();

program
  .name('ai-toolkit')
  .description('AI Toolkit - Build MCPs, Claude commands, and AI workflows')
  .version('0.1.0');

// Generate commands
const generate = program
  .command('generate')
  .alias('g')
  .description('Generate new components (MCP, command, agent, etc.)');

generate
  .command('mcp')
  .description('Generate a new MCP server')
  .argument('<name>', 'Name of the MCP server')
  .option('-d, --description <desc>', 'Description of the MCP')
  .option('-o, --output <dir>', 'Output directory', './apps')
  .option('--fastmcp', 'Use FastMCP template', true)
  .option('--cicd <provider>', 'CI/CD provider (github, harness, none)', 'github')
  .option('--deployment <platform>', 'Deployment platform (aws, gcp, none)', 'aws')
  .option('--dry-run', 'Preview without creating files', false)
  .action(generateMCP);

generate
  .command('command')
  .description('Generate a new Claude command')
  .argument('<name>', 'Name of the command (without /)')
  .option('-d, --description <desc>', 'Description of the command')
  .option('-o, --output <dir>', 'Output directory', './claude/commands')
  .option('--args <arguments...>', 'Command arguments')
  .option('--tools <tools...>', 'Allowed tools')
  .option('--global', 'Install globally to ~/.claude/commands', false)
  .option('--dry-run', 'Preview without creating files', false)
  .action(generateCommand);

generate
  .command('agent')
  .description('Generate a new Claude agent')
  .argument('<name>', 'Name of the agent')
  .option('-d, --description <desc>', 'Description of the agent')
  .option('-o, --output <dir>', 'Output directory', './claude/agents')
  .option('--model <model>', 'Model to use (sonnet, opus, haiku)', 'sonnet')
  .option('--tools <tools...>', 'Available tools')
  .option('--global', 'Install globally to ~/.claude/agents', false)
  .option('--dry-run', 'Preview without creating files', false)
  .action(generateAgent);

// Deploy command
program
  .command('deploy')
  .description('Deploy an MCP server')
  .argument('<name>', 'Name of the MCP to deploy')
  .option('-p, --platform <platform>', 'Deployment platform (aws, gcp)', 'aws')
  .option('--region <region>', 'AWS/GCP region')
  .option('--env <env>', 'Environment (dev, staging, prod)', 'dev')
  .action(deployMCP);

// License management
program
  .command('login')
  .description('Authenticate and manage your license')
  .option('--key <key>', 'License key')
  .action(loginCommand);

program
  .command('status')
  .description('Show license status and available features')
  .action(statusCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    logger.error(error.message || 'An unexpected error occurred');
    process.exit(1);
  }
}
