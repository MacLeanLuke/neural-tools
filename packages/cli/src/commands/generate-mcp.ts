import path from 'path';
import fs from 'fs-extra';
import { logger, requireFeature } from '@ai-toolkit/core';
import inquirer from 'inquirer';

interface GenerateMCPOptions {
  description?: string;
  output?: string;
  fastmcp?: boolean;
  cicd?: 'github' | 'harness' | 'none';
  deployment?: 'aws' | 'gcp' | 'none';
  dryRun?: boolean;
}

export async function generateMCP(name: string, options: GenerateMCPOptions): Promise<void> {
  logger.header(`Generating MCP: ${name}`);

  // Check license for cloud deployment
  if (options.deployment !== 'none') {
    await requireFeature('cloud-deployment', 'Cloud Deployment');
  }

  // Prompt for missing information
  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of your MCP:',
        default: `${name} MCP server`
      }
    ]);
    description = answers.description;
  }

  const outputDir = path.resolve(options.output || './apps', name);

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: ${name}`,
      `Description: ${description}`,
      `Output: ${outputDir}`,
      `Template: ${options.fastmcp ? 'FastMCP' : 'Standard'}`,
      `CI/CD: ${options.cicd}`,
      `Deployment: ${options.deployment}`
    ]);
    return;
  }

  // Check if directory already exists
  if (await fs.pathExists(outputDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${outputDir} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }

    await fs.remove(outputDir);
  }

  logger.startSpinner('Creating MCP structure...');

  try {
    // Create directory structure
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(outputDir, 'src'));
    await fs.ensureDir(path.join(outputDir, 'src', 'tools'));
    await fs.ensureDir(path.join(outputDir, 'src', 'prompts'));
    await fs.ensureDir(path.join(outputDir, 'src', 'resources'));

    // Create package.json
    const packageJson = {
      name: `mcp-${name}`,
      version: '0.1.0',
      description,
      main: 'dist/index.js',
      type: 'module',
      scripts: {
        build: 'tsc',
        dev: 'tsx watch src/index.ts',
        start: 'node dist/index.js',
        test: 'echo "Tests coming soon"'
      },
      dependencies: {
        'fastmcp': '^1.0.0'
      },
      devDependencies: {
        '@types/node': '^20.11.5',
        'typescript': '^5.3.3',
        'tsx': '^4.7.0'
      }
    };

    await fs.writeJSON(path.join(outputDir, 'package.json'), packageJson, { spaces: 2 });

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        lib: ['ES2022'],
        moduleResolution: 'bundler',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    await fs.writeJSON(path.join(outputDir, 'tsconfig.json'), tsconfig, { spaces: 2 });

    // Create main index.ts with FastMCP
    const indexContent = `import { FastMCP } from 'fastmcp';

const mcp = new FastMCP({
  name: '${name}',
  version: '0.1.0',
  description: '${description}'
});

// Example tool
mcp.addTool({
  name: 'example_tool',
  description: 'An example tool',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'A message to process'
      }
    },
    required: ['message']
  },
  execute: async (args: { message: string }) => {
    return {
      content: [
        {
          type: 'text',
          text: \`Processed: \${args.message}\`
        }
      ]
    };
  }
});

// Example prompt
mcp.addPrompt({
  name: 'example_prompt',
  description: 'An example prompt',
  arguments: [
    {
      name: 'topic',
      description: 'Topic to discuss',
      required: true
    }
  ],
  execute: async (args: { topic: string }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: \`Let's discuss \${args.topic}\`
          }
        }
      ]
    };
  }
});

// Example resource
mcp.addResource({
  uri: 'example://resource',
  name: 'Example Resource',
  description: 'An example resource',
  mimeType: 'text/plain',
  text: async () => {
    return 'This is an example resource';
  }
});

// Start the server
mcp.start({
  transportType: 'stdio'
});
`;

    await fs.writeFile(path.join(outputDir, 'src', 'index.ts'), indexContent, 'utf-8');

    // Create README
    const readmeContent = `# ${name} MCP Server

${description}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Usage

Add to your Claude Code settings:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "node",
      "args": ["/path/to/dist/index.js"]
    }
  }
}
\`\`\`

## Features

- Example tool: Process messages
- Example prompt: Generate discussions
- Example resource: Serve static content

## License

MIT
`;

    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent, 'utf-8');

    // Add CI/CD if requested
    if (options.cicd === 'github') {
      await fs.ensureDir(path.join(outputDir, '.github', 'workflows'));
      const workflowContent = `name: Deploy MCP

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm test

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      ${options.deployment === 'aws' ? '- run: npm run deploy:aws' : ''}
`;

      await fs.writeFile(
        path.join(outputDir, '.github', 'workflows', 'deploy.yml'),
        workflowContent,
        'utf-8'
      );
    }

    logger.succeedSpinner('MCP created successfully!');

    logger.section('Next steps', [
      `1. cd ${outputDir}`,
      '2. npm install',
      '3. npm run dev',
      '',
      'Add to Claude Code settings to use this MCP'
    ]);

    logger.success(`✨ MCP "${name}" ready to use!`);
  } catch (error: any) {
    logger.failSpinner('Failed to create MCP');
    throw error;
  }
}
