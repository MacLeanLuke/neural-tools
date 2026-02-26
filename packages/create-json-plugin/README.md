# @neural-tools/create-json-plugin

Scaffold Claude plugins that include:

- A JSON-output skill (`skills/<skill-name>/SKILL.md`)
- A custom JSON LSP config (`.lsp.json`)
- A local schema (`schemas/*.schema.json`)
- Hook scripts (`hooks/`) that enforce schema validation on writes/edits
- A starter config file validated against that schema

## Usage

```bash
pnpm --filter @neural-tools/create-json-plugin build
node packages/create-json-plugin/dist/index.js my-plugin
```

Or after publishing:

```bash
npx @neural-tools/create-json-plugin my-plugin
```

## Defaults

- Skill name: `generate-json-config`
- Output config file: `config.json`
- Schema file: `config.schema.json`
- Output directory: `./claude/plugins`

## CLI options

- `-d, --description <desc>` Plugin description
- `-o, --output <dir>` Output directory for plugins
- `--skill <name>` Skill name to create
- `--file-name <name>` Target JSON config file name
- `--schema-name <name>` Schema file name
- `--version <version>` Plugin version
- `--author <name>` Plugin author
- `--dry-run` Preview without writing files
