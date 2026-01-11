#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { execa } from 'execa';
import pc from 'picocolors';

const program = new Command();

interface ScaffoldOptions {
  template?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn';
  skipInstall?: boolean;
}

program
  .name('create-neural-tools')
  .description('Create a new Neural Tools workspace')
  .argument('[project-name]', 'Name of your project')
  .option('-t, --template <template>', 'Template to use (full, minimal)', 'full')
  .option('-p, --package-manager <pm>', 'Package manager (npm, pnpm, yarn)', 'pnpm')
  .option('--skip-install', 'Skip dependency installation', false)
  .action(async (projectName: string | undefined, options: ScaffoldOptions) => {
    await createProject(projectName, options);
  });

async function createProject(projectName: string | undefined, options: ScaffoldOptions): Promise<void> {
  console.log(pc.cyan(pc.bold('\n✨ Neural Tools Project Generator\n')));

  // Prompt for project name if not provided
  let name = projectName;
  if (!name) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-ai-toolkit',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Project name is required';
          }
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Project name must be lowercase, alphanumeric with hyphens';
          }
          return true;
        }
      }
    ]);
    name = answers.projectName;
  }

  if (!name) {
    console.log(pc.red('\n✗ Project name is required\n'));
    process.exit(1);
  }

  const projectDir = path.resolve(process.cwd(), name);

  // Check if directory exists
  if (await fs.pathExists(projectDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${name} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(pc.yellow('\n⚠ Cancelled\n'));
      process.exit(0);
    }

    await fs.remove(projectDir);
  }

  // Prompt for template and package manager if not provided
  const config = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      default: options.template,
      when: !options.template,
      choices: [
        {
          name: 'Full - Complete toolkit with examples',
          value: 'full'
        },
        {
          name: 'Minimal - Basic structure only',
          value: 'minimal'
        }
      ]
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager:',
      default: options.packageManager,
      when: !options.packageManager,
      choices: ['pnpm', 'npm', 'yarn']
    }
  ]);

  const template = config.template || options.template || 'full';
  const packageManager = config.packageManager || options.packageManager || 'pnpm';

  console.log(pc.blue('\n→ Creating project structure...\n'));

  // Create project directory
  await fs.ensureDir(projectDir);

  // Create workspace structure
  await createWorkspaceStructure(projectDir, template, name);

  console.log(pc.green('✓ Project structure created\n'));

  // Install dependencies
  if (!options.skipInstall) {
    console.log(pc.blue('→ Installing dependencies...\n'));

    try {
      await execa(packageManager, ['install'], {
        cwd: projectDir,
        stdio: 'inherit'
      });

      console.log(pc.green('\n✓ Dependencies installed\n'));
    } catch (error) {
      console.log(pc.yellow('\n⚠ Failed to install dependencies\n'));
      console.log(pc.dim(`Run "cd ${name} && ${packageManager} install" manually\n`));
    }
  }

  // Print next steps
  printNextSteps(name, packageManager);
}

async function createWorkspaceStructure(
  projectDir: string,
  template: string,
  projectName: string
): Promise<void> {
  // Create directories
  await fs.ensureDir(path.join(projectDir, 'apps'));
  await fs.ensureDir(path.join(projectDir, 'packages'));
  await fs.ensureDir(path.join(projectDir, 'claude', 'commands'));
  await fs.ensureDir(path.join(projectDir, 'claude', 'rules'));
  await fs.ensureDir(path.join(projectDir, 'claude', 'hooks'));
  await fs.ensureDir(path.join(projectDir, 'claude', 'agents'));
  await fs.ensureDir(path.join(projectDir, 'scripts'));
  await fs.ensureDir(path.join(projectDir, '.github', 'workflows'));

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    description: 'Neural Tools workspace',
    scripts: {
      build: 'pnpm -r build',
      dev: 'pnpm -r --parallel dev',
      test: 'pnpm -r test',
      'generate:mcp': 'neural-tools generate mcp',
      'generate:command': 'neural-tools generate command',
      'generate:agent': 'neural-tools generate agent'
    },
    devDependencies: {
      '@neural-tools/cli': '^0.1.0',
      typescript: '^5.3.3'
    },
    packageManager: 'pnpm@8.15.1'
  };

  await fs.writeJSON(path.join(projectDir, 'package.json'), packageJson, { spaces: 2 });

  // Create pnpm-workspace.yaml
  const workspaceConfig = `packages:
  - 'apps/*'
  - 'packages/*'
`;

  await fs.writeFile(path.join(projectDir, 'pnpm-workspace.yaml'), workspaceConfig, 'utf-8');

  // Create CLAUDE.md
  const claudeMd = `# ${projectName}

AI Toolkit workspace for building MCPs, Claude commands, and AI workflows.

## Project Structure

- \`apps/\` - MCP servers and deployable applications
- \`packages/\` - Reusable libraries and shared code
- \`claude/\` - Claude Code customizations (commands, rules, agents, hooks)
- \`scripts/\` - Utility scripts

## Coding Standards

- Use TypeScript for all code
- Follow ESM module format
- Write tests for all public APIs
- Document complex logic with comments

## AI Workflow

This project uses AI Toolkit to accelerate development:
- Generate MCPs: \`npm run generate:mcp <name>\`
- Generate commands: \`npm run generate:command <name>\`
- Generate agents: \`npm run generate:agent <name>\`

## Getting Started

1. Install dependencies: \`pnpm install\`
2. Generate your first MCP: \`pnpm generate:mcp github\`
3. Build all packages: \`pnpm build\`
4. Start development: \`pnpm dev\`
`;

  await fs.writeFile(path.join(projectDir, 'CLAUDE.md'), claudeMd, 'utf-8');

  // Create README.md
  const readme = `# ${projectName}

AI Toolkit workspace for building intelligent productivity tools.

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Generate a new MCP server
pnpm generate:mcp my-integration

# Generate a Claude command
pnpm generate:command my-command

# Build all packages
pnpm build
\`\`\`

## What's Included

- **MCP Generation**: Create FastMCP servers with one command
- **Claude Commands**: Custom slash commands for Claude Code
- **Claude Agents**: Specialized AI agents for your workflows
- **Vector DB**: Semantic search and caching (Pro)
- **Cloud Deployment**: AWS/GCP deployment templates (Pro)

## Documentation

- [AI Toolkit Documentation](https://ai-toolkit.dev/docs)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

## License

MIT
`;

  await fs.writeFile(path.join(projectDir, 'README.md'), readme, 'utf-8');

  // Create .gitignore
  const gitignore = `node_modules
dist
.DS_Store
*.log
.env
.env.local
CLAUDE.local.md
.ai-toolkit
`;

  await fs.writeFile(path.join(projectDir, '.gitignore'), gitignore, 'utf-8');

  // Create example command if full template
  if (template === 'full') {
    const exampleCommand = `---
description: Search the knowledge base
argument-hint: query
---

# Search Knowledge Base

Search your vector database for relevant information.

Query: $1

Use semantic search to find the most relevant documents and context.
`;

    await fs.writeFile(
      path.join(projectDir, 'claude', 'commands', 'search-kb.md'),
      exampleCommand,
      'utf-8'
    );
  }
}

function printNextSteps(projectName: string, packageManager: string): void {
  console.log(pc.green(pc.bold('🎉 Project created successfully!\n')));
  console.log(pc.cyan('Next steps:\n'));
  console.log(pc.dim(`  cd ${projectName}`));
  console.log(pc.dim(`  ${packageManager} generate:mcp github`));
  console.log(pc.dim(`  ${packageManager} generate:command search-kb`));
  console.log(pc.dim(`  ${packageManager} build\n`));
  console.log(pc.cyan('Documentation:\n'));
  console.log(pc.dim('  https://ai-toolkit.dev/docs\n'));
  console.log(pc.green('Happy building! ✨\n'));
}

program.parse();
