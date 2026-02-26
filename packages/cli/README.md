# @neural-tools/cli

> CLI for Neural Tools - Generate MCPs, Claude commands, skills, plugins, and AI workflows

[![npm version](https://img.shields.io/npm/v/@neural-tools/cli)](https://www.npmjs.com/package/@neural-tools/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE.md)

The main CLI tool for Neural Tools, providing commands to generate MCP servers, Claude commands, skills, agents, plugins, and deploy AI-powered applications.

## Installation

### Global Installation (Recommended)

```bash
npm install -g @neural-tools/cli
```

### Project-specific

```bash
npm install --save-dev @neural-tools/cli
```

### Using npx (No installation)

```bash
npx @neural-tools/cli <command>
```

## Usage

```bash
neural-tools <command> [options]
```

## Available Commands

### `generate mcp`

Generate a FastMCP server with Python templates.

```bash
neural-tools generate mcp <name> [options]

Options:
  -d, --description <desc>      Description of the MCP server
  -o, --output <dir>            Output directory (default: ./apps)
  --cicd <provider>             CI/CD provider (github, harness, none)
  --deployment <platform>       Deployment platform (aws, gcp, none)
  --dry-run                     Preview without creating files
```

**Example:**

```bash
neural-tools generate mcp github-integration \
  --description "GitHub API integration server" \
  --cicd github \
  --deployment aws
```

This creates:
- Complete FastMCP server with Python
- Docker configuration
- CI/CD workflow files
- Deployment templates (if specified)

---

### `generate command`

Generate a Claude Code slash command.

```bash
neural-tools generate command <name> [options]

Options:
  -d, --description <desc>    Description of the command
  -o, --output <dir>          Output directory (default: ./claude/commands)
  --args <arguments...>       Command arguments
  --tools <tools...>          Allowed tools for Claude
  --global                    Install globally to ~/.claude/commands
  --dry-run                   Preview without creating files
```

**Example:**

```bash
neural-tools generate command search-docs \
  --description "Search project documentation" \
  --args query \
  --tools "Read" "Grep" "Bash"
```

This creates a slash command that can be used in Claude Code as `/search-docs <query>`.

---

### `generate agent`

Generate a specialized Claude agent.

```bash
neural-tools generate agent <name> [options]

Options:
  -d, --description <desc>    Description of the agent
  -o, --output <dir>          Output directory (default: ./claude/agents)
  --model <model>             Model to use (sonnet, opus, haiku)
  --tools <tools...>          Available tools
  --global                    Install globally to ~/.claude/agents
  --dry-run                   Preview without creating files
```

**Example:**

```bash
neural-tools generate agent code-reviewer \
  --description "Automated code review agent" \
  --model opus \
  --tools "Read" "Grep" "Edit"
```

---

### `generate skill`

Generate a Claude Code skill (`SKILL.md`) for local/global use or inside a plugin.

```bash
neural-tools generate skill <name> [options]

Options:
  -d, --description <desc>    Description of the skill
  -o, --output <dir>          Output directory (default: ./claude/skills)
  --plugin <dir>              Create skill in <dir>/skills/<name>
  --references                Create references/ scaffold
  --global                    Install globally to ~/.claude/skills
  --dry-run                   Preview without creating files
```

**Example:**

```bash
neural-tools generate skill api-review \
  --description "Review API design and docs for consistency" \
  --references
```

---

### `generate plugin`

Generate a Claude Code plugin scaffold with `.claude-plugin/plugin.json`.

```bash
neural-tools generate plugin <name> [options]

Options:
  -d, --description <desc>    Description of the plugin
  -o, --output <dir>          Output directory (default: ./claude/plugins)
  --version <version>         Plugin version (default: 0.1.0)
  --author <author>           Plugin author
  --with-skill <name>         Create a starter skill in the plugin
  --dry-run                   Preview without creating files
```

**Example:**

```bash
neural-tools generate plugin engineering-workflows \
  --description "Internal engineering workflows for Claude Code" \
  --author "ACME Inc." \
  --with-skill bug-triage
```

---

### `deploy`

Deploy an MCP server to AWS or GCP.

```bash
neural-tools deploy <name> [options]

Options:
  -p, --platform <platform>    Deployment platform (aws, gcp)
  --region <region>            Cloud region
  --env <env>                  Environment (dev, staging, prod)
```

**Example:**

```bash
neural-tools deploy github-integration \
  --platform aws \
  --region us-east-1 \
  --env production
```

---

### `login`

Manage your Neural Tools license (optional).

```bash
neural-tools login [options]

Options:
  --key <key>    License key
```

**Note:** All features are free and available without a license.

---

### `status`

View current status and available features.

```bash
neural-tools status
```

Shows:
- License information (if configured)
- Available features (all features are enabled)
- Quick start commands

## Project Structure

When you use the CLI, it creates organized project structures:

```
my-project/
├── apps/                    # Generated MCP servers
│   └── mcp-github/
│       ├── server.py
│       ├── Dockerfile
│       └── requirements.txt
├── claude/
│   ├── commands/           # Slash commands
│   │   └── search-docs.md
│   ├── skills/             # Standalone Claude skills
│   │   └── api-review/SKILL.md
│   └── agents/             # Specialized agents
│       └── code-reviewer.md
│   └── plugins/            # Claude plugins
│       └── engineering-workflows/
│           ├── .claude-plugin/plugin.json
│           └── skills/
│               └── bug-triage/SKILL.md
└── package.json
```

## Configuration

The CLI reads configuration from:
- `package.json` (workspace settings)
- `.env` (environment variables)
- `~/.ai-toolkit/` (user settings)

## Development

```bash
# Clone the repository
git clone https://github.com/MacLeanLuke/neural-tools.git
cd neural-tools/packages/cli

# Install dependencies
pnpm install

# Build
pnpm build

# Run locally
node dist/cli.js --help
```

## Examples

### Create a GitHub MCP Server

```bash
neural-tools generate mcp github \
  --description "GitHub API integration" \
  --cicd github \
  --deployment aws
```

### Create a Knowledge Base Search Command

```bash
neural-tools generate command search-kb \
  --description "Search vector database" \
  --args query \
  --tools "Read" "Bash"
```

### Deploy to AWS

```bash
neural-tools deploy github \
  --platform aws \
  --region us-east-1 \
  --env prod
```

## Dependencies

- [@neural-tools/core](../core) - Core utilities and types
- commander - CLI framework
- inquirer - Interactive prompts
- execa - Process execution
- fs-extra - Enhanced file system operations

## Contributing

Contributions are welcome! See the [main repository](https://github.com/MacLeanLuke/neural-tools) for guidelines.

## License

MIT - See [LICENSE.md](../../LICENSE.md) for details.

## Links

- [Documentation](https://neural-tools.com/docs/cli.html)
- [GitHub](https://github.com/MacLeanLuke/neural-tools)
- [npm](https://www.npmjs.com/package/@neural-tools/cli)
- [Issues](https://github.com/MacLeanLuke/neural-tools/issues)
