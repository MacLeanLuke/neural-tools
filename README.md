# Neural Tools

**The complete toolkit for building AI-powered productivity tools**

Build MCP servers, Claude commands, vector databases, and AI workflows with one command.

[![npm version](https://badge.fury.io/js/%40neural-tools%2Fcli.svg)](https://www.npmjs.com/package/@neural-tools/cli)
[![License](https://img.shields.io/badge/license-Custom-blue.svg)](LICENSE.md)

## Features

- 🚀 **MCP Generation** - Create FastMCP servers in seconds
- 🎯 **Claude Commands** - Custom slash commands for Claude Code
- 🤖 **Claude Agents** - Specialized AI agents for your workflows
- 🧠 **Vector Database** - Semantic search and caching (Pro)
- ☁️ **Cloud Deployment** - AWS/GCP deployment templates (Pro)
- 🔄 **GitHub Automation** - Automate your development workflow (Pro)
- 🎨 **Fine-tuning** - Train specialized models (Pro)

## Quick Start

```bash
# Create a new project
npx @neural-tools/create@latest my-neural-workspace

cd my-neural-workspace

# Generate an MCP server
npx neural-tools generate mcp github

# Generate a Claude command
npx neural-tools generate command search-kb

# Deploy to AWS (Pro)
npx neural-tools deploy github --platform aws
```

## Installation

### Global Installation

```bash
npm install -g @neural-tools/cli
```

### Project-specific

```bash
npm install --save-dev @neural-tools/cli
```

## Usage

### Generate an MCP Server

```bash
neural-tools generate mcp <name> [options]

Options:
  -d, --description <desc>      Description of the MCP
  -o, --output <dir>            Output directory (default: ./apps)
  --cicd <provider>             CI/CD provider (github, harness, none)
  --deployment <platform>       Deployment platform (aws, gcp, none)
  --dry-run                     Preview without creating files
```

**Example:**

```bash
neural-tools generate mcp github \
  --description "GitHub API integration" \
  --cicd github \
  --deployment aws
```

### Generate a Claude Command

```bash
neural-tools generate command <name> [options]

Options:
  -d, --description <desc>    Description of the command
  -o, --output <dir>          Output directory (default: ./claude/commands)
  --args <arguments...>       Command arguments
  --tools <tools...>          Allowed tools
  --global                    Install globally to ~/.claude/commands
  --dry-run                   Preview without creating files
```

**Example:**

```bash
neural-tools generate command search-kb \
  --description "Search knowledge base" \
  --args query \
  --tools "Read" "Bash" \
  --global
```

### Generate a Claude Agent

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
  --description "Specialized code review agent" \
  --model opus \
  --tools "Read" "Grep" "Bash" \
  --global
```

### Deploy an MCP

```bash
neural-tools deploy <name> [options]

Options:
  -p, --platform <platform>    Deployment platform (aws, gcp)
  --region <region>            AWS/GCP region
  --env <env>                  Environment (dev, staging, prod)
```

**Example:**

```bash
neural-tools deploy github \
  --platform aws \
  --region us-east-1 \
  --env prod
```

### License Management

```bash
# Activate license
neural-tools login --key <your-license-key>

# Check status
neural-tools status
```

## Packages

This repository is a monorepo containing the following packages:

| Package | Description | Version |
|---------|-------------|---------|
| [@neural-tools/cli](packages/cli) | Main CLI tool | ![npm](https://img.shields.io/npm/v/@neural-tools/cli) |
| [@neural-tools/core](packages/core) | Core utilities and types | ![npm](https://img.shields.io/npm/v/@neural-tools/core) |
| [@neural-tools/create](packages/create-ai-toolkit) | Project scaffolding tool | ![npm](https://img.shields.io/npm/v/@neural-tools/create) |
| [@neural-tools/vector-db](packages/vector-db) | Vector database abstraction | ![npm](https://img.shields.io/npm/v/@neural-tools/vector-db) |
| [@neural-tools/semantic-cache](packages/semantic-cache) | Semantic caching for LLMs | ![npm](https://img.shields.io/npm/v/@neural-tools/semantic-cache) |
| [@neural-tools/fine-tune](packages/fine-tune) | Fine-tuning utilities | ![npm](https://img.shields.io/npm/v/@neural-tools/fine-tune) |

## Example MCPs

The toolkit includes example MCPs to get you started:

- **mcp-github** - GitHub API integration
- **mcp-knowledge** - Vector database with semantic search
- **mcp-tasks** - Task and project management

## Example Claude Commands

Pre-built commands for common workflows:

- `/search-kb` - Search your vector database
- `/save-context` - Save conversation to knowledge base
- `/github-issue` - Create GitHub issue from context

## Pricing

### Free Tier
- ✅ MCP generation
- ✅ Claude commands
- ✅ Basic templates
- ✅ Local development

### Pro ($49/month)
- ✅ Everything in Free
- ✅ Vector database integration
- ✅ Semantic caching
- ✅ Fine-tuning workflows
- ✅ Cloud deployment (AWS/GCP)
- ✅ Premium templates
- ✅ GitHub automation

### Enterprise (Custom)
- ✅ Everything in Pro
- ✅ White-label support
- ✅ Custom integrations
- ✅ Priority support
- ✅ SLA guarantee
- ✅ Team collaboration features

Visit [neural-tools.com](https://neural-tools.com) for more information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- 📚 Documentation: Check the package READMEs for detailed information
- 🐛 Issues: Report bugs or request features via GitHub Issues

## License

See [LICENSE.md](LICENSE.md) for details.

---

**Built by Luke Amy**

[Website](https://neural-tools.com) · [GitHub](https://github.com/MacLeanLuke/neural-tools)
