# Neural Tools

Scaffolding for AI infrastructure — MCP servers, Claude commands and agents, vector
databases, and the deployment glue around them.

[![npm version](https://img.shields.io/npm/v/@neural-tools/cli.svg)](https://www.npmjs.com/package/@neural-tools/cli)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

## Why

Standing up a new MCP server means the same twenty minutes every time: project
layout, transport wiring, auth, a Dockerfile, a CI workflow, a deploy target. None
of it is interesting and all of it is easy to get subtly wrong.

Neural Tools turns that into one command, with **explicit configuration over magic**
— generated projects are ordinary readable code you own, not a framework you're
locked into.

## Quick start

```bash
# Create a workspace
npx @neural-tools/create@latest my-neural-workspace
cd my-neural-workspace

# Generate an MCP server
npx neural-tools generate mcp github

# Generate a Claude slash command
npx neural-tools generate command search-kb

# Ship it
npx neural-tools deploy github --platform aws
```

## Install

```bash
npm install -g @neural-tools/cli     # global
npm install --save-dev @neural-tools/cli   # per project
```

## What it generates

| Command | Produces |
| --- | --- |
| `generate mcp <name>` | A FastMCP server with transport, auth, and config wired up |
| `generate command <name>` | A Claude Code slash command |
| `generate agent <name>` | A specialized agent definition |
| `generate skill <name>` | A reusable skill package |
| `generate plugin <name>` | A JSON-configured plugin |
| `deploy <name>` | Deployment to AWS or GCP |
| `login` / `status` | Auth and workspace state |

Every generator takes `--dry-run`, so you can see the file tree before anything is
written:

```bash
neural-tools generate mcp github \
  --description "GitHub API access" \
  --cicd github \
  --deployment aws \
  --dry-run
```

## Packages

A monorepo publishing four packages, all versioned together:

| Package | Role |
| --- | --- |
| [`@neural-tools/cli`](https://www.npmjs.com/package/@neural-tools/cli) | The `neural-tools` binary |
| [`@neural-tools/core`](https://www.npmjs.com/package/@neural-tools/core) | Shared types, logging, licensing |
| [`@neural-tools/create`](https://www.npmjs.com/package/@neural-tools/create) | `npm create` entry point for new workspaces |
| [`@neural-tools/fine-tune`](https://www.npmjs.com/package/@neural-tools/fine-tune) | Model fine-tuning workflows |

## Development

```bash
npm install
npm run build
npm test
npm run lint
```

Releases go through [Changesets](https://github.com/changesets/changesets):

```bash
npm run changeset     # describe the change
npm run version       # bump affected packages
npm run release       # publish
```

CI, publishing, and the docs site each have a workflow under `.github/workflows/`.

## Built with

TypeScript · [tsup](https://tsup.egoist.dev) for bundling · Commander and Inquirer
for the CLI surface · execa, globby, and fs-extra for the generator internals.

## License

MIT — see [LICENSE.md](LICENSE.md).
