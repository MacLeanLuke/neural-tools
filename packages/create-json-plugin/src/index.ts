#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { Command } from 'commander';
import { logger } from '@neural-tools/core';

interface GenerateJsonPluginOptions {
  description?: string;
  output?: string;
  skill?: string;
  fileName?: string;
  schemaName?: string;
  version?: string;
  author?: string;
  dryRun?: boolean;
}

interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
}

const program = new Command();

program
  .name('create-neural-json-plugin')
  .description('Create a Claude plugin with a JSON-output skill and custom JSON LSP validation')
  .argument('[plugin-name]', 'Name of the plugin')
  .option('-d, --description <desc>', 'Description of the plugin')
  .option('-o, --output <dir>', 'Output directory', './claude/plugins')
  .option('--skill <name>', 'Skill name', 'generate-json-config')
  .option('--file-name <name>', 'Name of the JSON config file', 'config.json')
  .option('--schema-name <name>', 'Name of the JSON schema file', 'config.schema.json')
  .option('--version <version>', 'Plugin version', '0.1.0')
  .option('--author <author>', 'Plugin author')
  .option('--dry-run', 'Preview without creating files', false)
  .action(async (pluginName: string | undefined, options: GenerateJsonPluginOptions) => {
    await createJsonPlugin(pluginName, options);
  });

async function createJsonPlugin(
  pluginName: string | undefined,
  options: GenerateJsonPluginOptions
): Promise<void> {
  logger.header('Create JSON Plugin');

  let name = pluginName;
  if (!name) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'pluginName',
        message: 'Plugin name:',
        default: 'json-config-plugin',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Plugin name is required';
          }
          return true;
        }
      }
    ]);
    name = answers.pluginName;
  }

  if (!name) {
    throw new Error('Plugin name is required');
  }

  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Plugin description:',
        default: `${name} plugin with JSON skill + schema validation`
      }
    ]);
    description = answers.description;
  }

  const finalDescription = description || `${name} plugin with JSON skill + schema validation`;

  const skillName = options.skill || 'generate-json-config';
  const fileName = options.fileName || 'config.json';
  const schemaName = options.schemaName || 'config.schema.json';
  const pluginDir = path.resolve(options.output || './claude/plugins', name);
  const pluginConfigDir = path.join(pluginDir, '.claude-plugin');
  const pluginConfigFile = path.join(pluginConfigDir, 'plugin.json');
  const schemaDir = path.join(pluginDir, 'schemas');
  const schemaPath = path.join(schemaDir, schemaName);
  const skillDir = path.join(pluginDir, 'skills', skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const hooksDir = path.join(pluginDir, 'hooks');
  const hookScriptsDir = path.join(hooksDir, 'scripts');
  const hooksConfigPath = path.join(hooksDir, 'hooks.json');
  const validateScriptPath = path.join(hookScriptsDir, 'validate-json-config.py');
  const ensureLspScriptPath = path.join(hookScriptsDir, 'ensure-json-lsp.sh');
  const starterConfigDir = path.join(pluginDir, 'examples');
  const starterConfigPath = path.join(starterConfigDir, fileName);
  const lspConfigPath = path.join(pluginDir, '.lsp.json');

  if (options.dryRun) {
    logger.section('Dry Run', [
      `Plugin directory: ${pluginDir}`,
      `Manifest: ${pluginConfigFile}`,
      `LSP config: ${lspConfigPath}`,
      `Schema: ${schemaPath}`,
      `Skill: ${skillFile}`,
      `Hooks config: ${hooksConfigPath}`,
      `Validation hook: ${validateScriptPath}`,
      `Starter config: ${starterConfigPath}`
    ]);
    return;
  }

  if (await fs.pathExists(pluginConfigFile)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Plugin ${name} already exists at ${pluginDir}. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }

    await fs.remove(pluginDir);
  }

  logger.startSpinner('Scaffolding plugin...');

  try {
    await fs.ensureDir(pluginConfigDir);
    await fs.ensureDir(schemaDir);
    await fs.ensureDir(skillDir);
    await fs.ensureDir(hooksDir);
    await fs.ensureDir(hookScriptsDir);
    await fs.ensureDir(starterConfigDir);

    const manifest: PluginManifest = {
      name,
      version: options.version || '0.1.0',
      description: finalDescription
    };

    if (options.author) {
      manifest.author = options.author;
    }

    await fs.writeJSON(pluginConfigFile, manifest, { spaces: 2 });

    const lspConfig = {
      json: {
        command: 'vscode-json-languageserver',
        args: ['--stdio'],
        extensionToLanguage: {
          '.json': 'json'
        },
        settings: {
          json: {
            schemas: [
              {
                fileMatch: [`**/${fileName}`],
                url: `file://${'${CLAUDE_PLUGIN_ROOT}'}/schemas/${schemaName}`
              }
            ],
            validate: {
              enable: true
            }
          }
        }
      }
    };

    await fs.writeJSON(lspConfigPath, lspConfig, { spaces: 2 });

    const hooksConfig = {
      hooks: {
        SessionStart: [
          {
            hooks: [
              {
                type: 'command',
                command: `bash ${'${CLAUDE_PLUGIN_ROOT}'}/hooks/scripts/ensure-json-lsp.sh`,
                timeout: 60
              }
            ]
          }
        ],
        PreToolUse: [
          {
            matcher: 'Edit|Write|MultiEdit',
            hooks: [
              {
                type: 'command',
                command: `python3 ${'${CLAUDE_PLUGIN_ROOT}'}/hooks/scripts/validate-json-config.py`,
                timeout: 15
              }
            ]
          }
        ]
      }
    };

    await fs.writeJSON(hooksConfigPath, hooksConfig, { spaces: 2 });

    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: fileName,
      description: `Schema for ${fileName}`,
      type: 'object',
      required: ['version', 'settings'],
      properties: {
        version: {
          type: 'string'
        },
        settings: {
          type: 'object',
          minProperties: 1,
          properties: {
            enabled: { type: 'boolean' },
            mode: { type: 'string' }
          },
          additionalProperties: true
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'value'],
            properties: {
              name: { type: 'string' },
              value: {}
            },
            additionalProperties: true
          }
        }
      },
      additionalProperties: true
    };

    await fs.writeJSON(schemaPath, schema, { spaces: 2 });

    const validateScript = `#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

TARGET_FILE = "${fileName}"
SCHEMA_FILE = "${schemaName}"

def load_schema(plugin_root: str) -> dict:
    schema_path = Path(plugin_root) / "schemas" / SCHEMA_FILE
    with open(schema_path, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_with_jsonschema(config: dict, plugin_root: str) -> list[str]:
    import jsonschema

    schema = load_schema(plugin_root)
    validator = jsonschema.Draft7Validator(schema)
    errors = []
    for error in sorted(validator.iter_errors(config), key=lambda e: str(e.path)):
        path = ".".join(str(p) for p in error.path) or "(root)"
        errors.append(f"  - {path}: {error.message}")
    return errors

def validate_basic(config: dict) -> list[str]:
    errors = []
    if "version" not in config:
        errors.append("  - Missing required field: version")
    if "settings" not in config:
        errors.append("  - Missing required field: settings")
    if "settings" in config and not isinstance(config["settings"], dict):
        errors.append("  - settings must be an object")
    return errors

def main() -> None:
    try:
        hook_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    if hook_data.get("tool_name") not in ("Write", "Edit", "MultiEdit"):
        sys.exit(0)

    tool_input = hook_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    content = tool_input.get("content", "")

    if not file_path.endswith(TARGET_FILE):
        sys.exit(0)

    try:
        config = json.loads(content)
    except json.JSONDecodeError as e:
        print(json.dumps({"decision": "block", "reason": f"JSON parse error in {Path(file_path).name}: {e}"}))
        sys.exit(0)

    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", str(Path(__file__).parent.parent.parent))
    try:
        errors = validate_with_jsonschema(config, plugin_root)
    except Exception:
        errors = validate_basic(config)

    if errors:
        lines = [f"JSON config validation failed for {Path(file_path).name}:"]
        lines.extend(errors)
        lines.append(f"Fix validation errors to match schema: {SCHEMA_FILE}")
        print(json.dumps({"decision": "block", "reason": "\\n".join(lines)}))

    sys.exit(0)

if __name__ == "__main__":
    main()
`;

    await fs.writeFile(validateScriptPath, validateScript, 'utf-8');
    await fs.chmod(validateScriptPath, 0o755);

    const ensureLspScript = `#!/bin/bash
WARNINGS=()

if ! command -v vscode-json-languageserver &>/dev/null; then
  if command -v npm &>/dev/null; then
    echo "Installing vscode-json-languageserver..."
    npm install -g vscode-json-languageserver --silent
    echo "JSON language server installed. Restart Claude Code to activate schema validation."
  else
    WARNINGS+=("vscode-json-languageserver not found. Install Node.js then run: npm install -g vscode-json-languageserver")
  fi
fi

if [[ \${#WARNINGS[@]} -gt 0 ]]; then
  echo ""
  echo "Plugin setup needed:"
  for w in "\${WARNINGS[@]}"; do
    echo "  - \$w"
  done
  echo ""
fi
`;

    await fs.writeFile(ensureLspScriptPath, ensureLspScript, 'utf-8');
    await fs.chmod(ensureLspScriptPath, 0o755);

    const skillContent = `---
name: ${skillName}
description: Generate ${fileName} JSON files that validate against ${schemaName}
---

# ${skillName}

Generate a valid \`${fileName}\` file.

## Rules

1. Output strict JSON only when producing the final config (no comments, no trailing commas).
2. Ensure the output matches schema at \`${schemaName}\`.
3. Include required top-level keys: \`version\` and \`settings\`.
4. Keep all values syntactically valid JSON and consistent with the schema.

## Output

Return the JSON in a fenced block with \`json\` language and save it as \`${fileName}\`.
`;

    await fs.writeFile(skillFile, skillContent, 'utf-8');

    const starterConfig = {
      version: '1.0.0',
      settings: {
        enabled: true,
        mode: 'standard'
      },
      items: [
        {
          name: 'example',
          value: 'demo'
        }
      ]
    };

    await fs.writeJSON(starterConfigPath, starterConfig, { spaces: 2 });

    const pluginReadme = `# ${name}

Generated by @neural-tools/create-json-plugin.

## What this plugin includes

- \`.lsp.json\` using \`vscode-json-languageserver\`
- JSON schema at \`schemas/${schemaName}\`
- Skill at \`skills/${skillName}/SKILL.md\` for generating \`${fileName}\`
- Hooks at \`hooks/hooks.json\` that enforce schema validation on edits/writes
- Starter config at \`examples/${fileName}\`

## Notes

Install the JSON language server if needed:

\`npm install -g vscode-json-languageserver\`
`;

    await fs.writeFile(path.join(pluginDir, 'README.md'), pluginReadme, 'utf-8');

    logger.succeedSpinner('Plugin created');
    logger.section('Created', [
      `Plugin: ${pluginDir}`,
      `Manifest: ${pluginConfigFile}`,
      `LSP config: ${lspConfigPath}`,
      `Schema: ${schemaPath}`,
      `Skill: ${skillFile}`,
      `Hooks config: ${hooksConfigPath}`,
      `Validation hook: ${validateScriptPath}`,
      `Starter config: ${starterConfigPath}`
    ]);
  } catch (error) {
    logger.failSpinner('Failed to create plugin');
    throw error;
  }
}

program.parse();

export { createJsonPlugin };
