# @neural-tools/create

> Scaffold a new Neural Tools workspace

[![npm version](https://img.shields.io/npm/v/@neural-tools/create)](https://www.npmjs.com/package/@neural-tools/create)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE.md)

Quick project scaffolding for Neural Tools. Creates a new workspace with all necessary configuration and structure.

## Usage

### Using npx (Recommended)

```bash
npx @neural-tools/create my-workspace
```

### Using npm

```bash
npm create @neural-tools my-workspace
```

### Interactive Mode

Run without arguments for an interactive setup:

```bash
npx @neural-tools/create
```

You'll be prompted for:
- Project name
- Description
- Template selection
- Package manager preference

## What Gets Created

```
my-workspace/
├── .gitignore
├── package.json
├── pnpm-workspace.yaml      # If using pnpm
├── README.md
├── apps/                    # MCP servers go here
│   └── .gitkeep
├── claude/
│   ├── commands/            # Slash commands
│   │   └── README.md
│   └── agents/              # Specialized agents
│       └── README.md
└── src/                     # Your application code
    └── index.ts
```

## Templates

Choose from pre-configured templates:

### Basic (Default)
Minimal setup with essential configuration.

```bash
npx @neural-tools/create my-workspace --template basic
```

### Full
Complete setup with examples and all features configured.

```bash
npx @neural-tools/create my-workspace --template full
```

### MCP
Optimized for MCP server development.

```bash
npx @neural-tools/create my-workspace --template mcp
```

### Monorepo
Pnpm workspace with multiple packages.

```bash
npx @neural-tools/create my-workspace --template monorepo
```

## Command Options

```bash
npx @neural-tools/create <project-name> [options]

Options:
  -t, --template <name>      Template to use (basic, full, mcp, monorepo)
  -p, --package-manager <pm> Package manager (npm, pnpm, yarn)
  --skip-install             Skip dependency installation
  --skip-git                 Skip git initialization
  -h, --help                 Display help
```

## Examples

### Create with specific template

```bash
npx @neural-tools/create my-ai-tools --template full
```

### Use pnpm

```bash
npx @neural-tools/create my-workspace -p pnpm
```

### Skip installation

```bash
npx @neural-tools/create my-workspace --skip-install
```

### Complete custom setup

```bash
npx @neural-tools/create my-workspace \
  --template monorepo \
  --package-manager pnpm \
  --skip-git
```

## After Creation

Once your workspace is created:

### 1. Navigate to project

```bash
cd my-workspace
```

### 2. Generate an MCP server

```bash
npx neural-tools generate mcp github \
  --description "GitHub integration"
```

### 3. Generate a Claude command

```bash
npx neural-tools generate command search \
  --description "Search project files"
```

### 4. Start developing

```bash
npm run dev
# or
pnpm dev
```

## Project Structure Details

### `/apps`
Contains generated MCP servers. Each server is a standalone application with its own dependencies and configuration.

### `/claude/commands`
Slash commands for Claude Code. These are markdown files that define custom commands you can use in Claude.

### `/claude/agents`
Specialized Claude agents with specific capabilities and system prompts.

### `/src`
Your application source code. The template includes a basic TypeScript setup.

## Configuration

The created project includes:

- **TypeScript** configuration
- **ESLint** setup (optional)
- **Prettier** configuration (optional)
- **Git** initialization
- **Package scripts** for common tasks
- **.gitignore** with sensible defaults

## Package Scripts

The generated `package.json` includes useful scripts:

```json
{
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc",
    "clean": "rm -rf dist",
    "generate:mcp": "neural-tools generate mcp",
    "generate:command": "neural-tools generate command"
  }
}
```

## Requirements

- Node.js 18+
- npm, pnpm, or yarn

## Development

```bash
# Clone repository
git clone https://github.com/MacLeanLuke/neural-tools.git
cd neural-tools/packages/create-ai-toolkit

# Install dependencies
pnpm install

# Build
pnpm build

# Test locally
node dist/index.js my-test-project
```

## Dependencies

- [@neural-tools/core](../core) - Core utilities
- commander - CLI framework
- inquirer - Interactive prompts
- execa - Process execution
- fs-extra - File operations
- degit - Template cloning

## Contributing

Contributions are welcome! See the [main repository](https://github.com/MacLeanLuke/neural-tools) for guidelines.

## License

MIT - See [LICENSE.md](../../LICENSE.md) for details.

## Links

- [Documentation](https://neural-tools.com/docs/create.html)
- [GitHub](https://github.com/MacLeanLuke/neural-tools)
- [npm](https://www.npmjs.com/package/@neural-tools/create)
