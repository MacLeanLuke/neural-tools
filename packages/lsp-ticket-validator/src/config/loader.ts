import * as fs from 'fs';
import * as path from 'path';
import {
  LSPConfig,
  LSPConfigSchema,
  TicketTemplate,
  ValidationRuleType,
  DiagnosticSeverity,
  TicketingSystem
} from '../types';
import { getDefaultTemplate } from '../validators';

/**
 * Configuration file names to search for
 */
const CONFIG_FILES = [
  '.ticket-lsp.json',
  '.ticket-lsp.config.json',
  'ticket-lsp.config.json',
];

/**
 * Load LSP configuration from a file
 */
export function loadConfig(configPath?: string): LSPConfig {
  let config: any;

  if (configPath) {
    // Load from specified path
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    // Search for config file in current directory and parent directories
    config = findAndLoadConfig(process.cwd());
  }

  if (!config) {
    // Return default configuration
    return getDefaultConfig();
  }

  // Validate configuration
  try {
    return LSPConfigSchema.parse(config);
  } catch (error) {
    throw new Error(`Invalid configuration: ${error}`);
  }
}

/**
 * Search for configuration file in directory tree
 */
function findAndLoadConfig(startDir: string): any {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    for (const configFile of CONFIG_FILES) {
      const configPath = path.join(currentDir, configFile);
      if (fs.existsSync(configPath)) {
        try {
          return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        } catch (error) {
          console.error(`Error parsing config file ${configPath}:`, error);
        }
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Get default configuration with all system templates
 */
export function getDefaultConfig(): LSPConfig {
  return {
    templates: [
      getDefaultTemplate(TicketingSystem.JIRA),
      getDefaultTemplate(TicketingSystem.LINEAR),
      getDefaultTemplate(TicketingSystem.GITHUB),
      getDefaultTemplate(TicketingSystem.GENERIC),
    ],
    defaultTemplate: 'Default Generic Template',
    enableCodeActions: true,
    enableCompletion: true,
    enableHover: true,
  };
}

/**
 * Save configuration to a file
 */
export function saveConfig(config: LSPConfig, outputPath: string): void {
  const validated = LSPConfigSchema.parse(config);
  fs.writeFileSync(outputPath, JSON.stringify(validated, null, 2), 'utf-8');
}

/**
 * Get template by name from configuration
 */
export function getTemplate(config: LSPConfig, templateName?: string): TicketTemplate {
  const name = templateName || config.defaultTemplate;

  if (!name) {
    // Return first template if no default is set
    if (config.templates.length > 0) {
      return config.templates[0];
    }
    throw new Error('No templates configured');
  }

  const template = config.templates.find((t) => t.name === name);

  if (!template) {
    throw new Error(`Template not found: ${name}`);
  }

  return template;
}

/**
 * Generate example configuration file
 */
export function generateExampleConfig(): LSPConfig {
  return {
    templates: [
      {
        name: 'My Jira Template',
        description: 'Custom Jira template for my team',
        system: TicketingSystem.JIRA,
        fields: [
          {
            path: 'fields.summary',
            label: 'Summary',
            rules: [
              {
                type: ValidationRuleType.REQUIRED,
                severity: DiagnosticSeverity.ERROR,
                message: 'Summary is required',
              },
              {
                type: ValidationRuleType.MIN_LENGTH,
                min: 20,
                severity: DiagnosticSeverity.WARNING,
                message: 'Summary should be descriptive (at least 20 chars)',
              },
              {
                type: ValidationRuleType.PATTERN,
                pattern: '^\\[.*\\].*',
                severity: DiagnosticSeverity.WARNING,
                message: 'Summary should start with a tag like [FEATURE] or [BUG]',
              },
            ],
          },
          {
            path: 'fields.description',
            label: 'Description',
            rules: [
              {
                type: ValidationRuleType.REQUIRED,
                severity: DiagnosticSeverity.ERROR,
              },
              {
                type: ValidationRuleType.MIN_LENGTH,
                min: 100,
                severity: DiagnosticSeverity.ERROR,
                message: 'Description must be at least 100 characters',
              },
            ],
          },
          {
            path: 'fields.project.key',
            label: 'Project',
            rules: [
              {
                type: ValidationRuleType.REQUIRED,
                severity: DiagnosticSeverity.ERROR,
              },
              {
                type: ValidationRuleType.ENUM,
                values: ['PROJ', 'TEAM', 'INFRA'],
                severity: DiagnosticSeverity.ERROR,
                message: 'Must be one of our project keys',
              },
            ],
          },
        ],
      },
    ],
    defaultTemplate: 'My Jira Template',
    enableCodeActions: true,
    enableCompletion: true,
    enableHover: true,
  };
}
