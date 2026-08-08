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
| `generate skill <name>` | A reusable skill package, with eval fixtures |
| `generate plugin <name>` | A JSON-configured plugin |
| `eval skill <path>` | Checks a skill against the selection contract |
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

## Skills get evals by default

A skill is chosen by its **description** — the model reads descriptions and
decides which to load. That makes the description the highest-risk part of a
skill, and it is the part nobody tests. A skill that never fires is invisible;
one that fires on the wrong request hijacks unrelated work.

So `generate skill` scaffolds `evals/triggers.json` alongside `SKILL.md`, and
there is a checker:

```bash
neural-tools eval skill ./claude/skills/invoice-parser
neural-tools eval skill ./claude/skills --strict   # every skill; warnings fail
```

It runs entirely offline — no model, no network, no API key — and checks the
contract that decides whether a skill can ever be selected:

| Rule | Severity |
| --- | --- |
| Frontmatter present and parseable | error |
| `name` present and matching its directory | error |
| `description` present | error |
| `description` long enough to disambiguate | error |
| `triggers.json` well-formed | error |
| `description` states *when* to use the skill | warning |
| Body is no longer the generated template | warning |
| Labeled trigger prompts exist | warning |
| Name is kebab-case | warning |

Selection itself is model-driven, so the model stays inside the system under
test and never inside the scorer — `scoreTriggers()` grades outcomes with plain
precision/recall. Precision is weighted more heavily in practice: a skill firing
when it shouldn't does more damage than one that occasionally misses.

Opt out with `--no-evals` if you must.

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
