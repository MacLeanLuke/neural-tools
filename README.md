# AI Toolkit

**The complete toolkit for building AI-powered productivity tools**

Build MCP servers, Claude commands, vector databases, and AI workflows with one command.

[![npm version](https://badge.fury.io/js/%40ai-toolkit%2Fcli.svg)](https://www.npmjs.com/package/@ai-toolkit/cli)
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
npx create-ai-toolkit@latest my-ai-workspace

cd my-ai-workspace

# Generate an MCP server
npx ai-toolkit generate mcp github

# Generate a Claude command
npx ai-toolkit generate command search-kb

# Deploy to AWS (Pro)
npx ai-toolkit deploy github --platform aws
```

## Installation

### Global Installation

```bash
npm install -g @ai-toolkit/cli
```

### Project-specific

```bash
npm install --save-dev @ai-toolkit/cli
```

## Usage

### Generate an MCP Server

```bash
ai-toolkit generate mcp <name> [options]

Options:
  -d, --description <desc>      Description of the MCP
  -o, --output <dir>            Output directory (default: ./apps)
  --cicd <provider>             CI/CD provider (github, harness, none)
  --deployment <platform>       Deployment platform (aws, gcp, none)
  --dry-run                     Preview without creating files
```

**Example:**

```bash
ai-toolkit generate mcp github \
  --description "GitHub API integration" \
  --cicd github \
  --deployment aws
```

### Generate a Claude Command

```bash
ai-toolkit generate command <name> [options]

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
ai-toolkit generate command search-kb \
  --description "Search knowledge base" \
  --args query \
  --tools "Read" "Bash" \
  --global
```

### Generate a Claude Agent

```bash
ai-toolkit generate agent <name> [options]

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
ai-toolkit generate agent code-reviewer \
  --description "Specialized code review agent" \
  --model opus \
  --tools "Read" "Grep" "Bash" \
  --global
```

### Deploy an MCP

```bash
ai-toolkit deploy <name> [options]

Options:
  -p, --platform <platform>    Deployment platform (aws, gcp)
  --region <region>            AWS/GCP region
  --env <env>                  Environment (dev, staging, prod)
```

**Example:**

```bash
ai-toolkit deploy github \
  --platform aws \
  --region us-east-1 \
  --env prod
```

### License Management

```bash
# Activate license
ai-toolkit login --key <your-license-key>

# Check status
ai-toolkit status
```

## Packages

This repository is a monorepo containing the following packages:

| Package | Description | Version |
|---------|-------------|---------|
| [@ai-toolkit/cli](packages/cli) | Main CLI tool | ![npm](https://img.shields.io/npm/v/@ai-toolkit/cli) |
| [@ai-toolkit/core](packages/core) | Core utilities and types | ![npm](https://img.shields.io/npm/v/@ai-toolkit/core) |
| [create-ai-toolkit](packages/create-ai-toolkit) | Project scaffolding tool | ![npm](https://img.shields.io/npm/v/create-ai-toolkit) |

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

[View Pricing Details →](https://ai-toolkit.dev/pricing)

## Documentation

- [Getting Started Guide](docs/getting-started.md)
- [MCP Development](docs/mcp-development.md)
- [Claude Commands](docs/claude-commands.md)
- [Vector Database Setup](docs/vector-database.md)
- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api-reference.md)

## Examples

Check out the [examples](examples/) directory for complete projects:

- [GitHub Automation](examples/github-automation) - Automate your GitHub workflow
- [Knowledge Management](examples/knowledge-management) - Build a semantic knowledge base

## Contributing

This is a private repository. Contributions are limited to team members.

## Support

- 📧 Email: support@ai-toolkit.dev
- 💬 Discord: [Join our community](https://discord.gg/ai-toolkit)
- 📚 Docs: [ai-toolkit.dev/docs](https://ai-toolkit.dev/docs)

## License

See [LICENSE.md](LICENSE.md) for details.

---

**Built with ❤️ by Luke Amy**

[Website](https://ai-toolkit.dev) · [Twitter](https://twitter.com/yourusername) · [GitHub](https://github.com/yourusername)
