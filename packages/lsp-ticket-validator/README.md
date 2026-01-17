# @neural-tools/lsp-ticket-validator

A Language Server Protocol (LSP) implementation for validating coding tickets across multiple ticketing systems. Designed for integration with AI agents and automated workflows to ensure tickets meet required standards before creation.

## Features

- **Cross-Platform Support**: Works with Jira, Linear, GitHub Issues, and generic ticketing systems
- **Extensible Validation**: Define custom validation rules using JSON configuration
- **Real-Time Feedback**: Provides instant validation feedback as tickets are created
- **LSP Integration**: Works with any LSP-compatible editor (VS Code, Neovim, etc.)
- **AI Agent Ready**: Perfect for agentic workflows that create tickets programmatically
- **Deterministic Validation**: Uses configurable rules to validate ticket structure and content

## Installation

```bash
npm install @neural-tools/lsp-ticket-validator
```

Or with pnpm:

```bash
pnpm add @neural-tools/lsp-ticket-validator
```

## Quick Start

### As a Language Server

Start the LSP server:

```bash
npx ticket-lsp
```

Configure your editor to use the LSP server. For VS Code, add to your settings:

```json
{
  "lsp": {
    "ticket-validator": {
      "command": "npx",
      "args": ["ticket-lsp"],
      "filetypes": ["json"],
      "rootPatterns": [".ticket-lsp.json"]
    }
  }
}
```

### Programmatic Usage

```typescript
import {
  createValidator,
  getDefaultTemplate,
  TicketingSystem,
  Ticket,
} from '@neural-tools/lsp-ticket-validator';

// Create a validator for Jira
const template = getDefaultTemplate(TicketingSystem.JIRA);
const validator = createValidator(template);

// Validate a ticket
const ticket: Ticket = {
  title: 'Implement user authentication',
  description: 'Add OAuth2 authentication for users',
  project: 'PROJ',
  issueType: 'Task',
};

const result = validator.validate(ticket);

if (!result.valid) {
  console.log('Validation errors:');
  result.errors.forEach((error) => {
    console.log(`  - ${error.message}`);
  });
}

// Get human-readable feedback
const feedback = validator.generateFeedback(result);
console.log(feedback);
```

## Configuration

Create a `.ticket-lsp.json` file in your project root:

```json
{
  "templates": [
    {
      "name": "My Jira Template",
      "description": "Custom validation for our Jira tickets",
      "system": "jira",
      "fields": [
        {
          "path": "fields.summary",
          "label": "Summary",
          "rules": [
            {
              "type": "required",
              "severity": "error",
              "message": "Summary is required"
            },
            {
              "type": "min_length",
              "min": 20,
              "severity": "warning",
              "message": "Summary should be at least 20 characters"
            },
            {
              "type": "pattern",
              "pattern": "^\\[.*\\].*",
              "severity": "warning",
              "message": "Summary should start with a tag like [FEATURE] or [BUG]"
            }
          ]
        },
        {
          "path": "fields.description",
          "label": "Description",
          "rules": [
            {
              "type": "required",
              "severity": "error"
            },
            {
              "type": "min_length",
              "min": 100,
              "severity": "error",
              "message": "Description must be at least 100 characters"
            }
          ]
        },
        {
          "path": "fields.project.key",
          "label": "Project",
          "rules": [
            {
              "type": "required",
              "severity": "error"
            },
            {
              "type": "enum",
              "values": ["PROJ", "TEAM", "INFRA"],
              "severity": "error",
              "message": "Must be one of our project keys"
            }
          ]
        }
      ]
    }
  ],
  "defaultTemplate": "My Jira Template",
  "enableCodeActions": true,
  "enableCompletion": true,
  "enableHover": true
}
```

## Validation Rules

### Rule Types

#### `required`
Ensures a field has a value.

```json
{
  "type": "required",
  "severity": "error",
  "message": "This field is required"
}
```

#### `min_length`
Validates minimum length for strings or arrays.

```json
{
  "type": "min_length",
  "min": 10,
  "severity": "warning",
  "message": "Field should be at least 10 characters"
}
```

#### `max_length`
Validates maximum length for strings or arrays.

```json
{
  "type": "max_length",
  "max": 255,
  "severity": "error",
  "message": "Field must not exceed 255 characters"
}
```

#### `pattern`
Validates against a regular expression.

```json
{
  "type": "pattern",
  "pattern": "^[A-Z]{2,10}$",
  "flags": "i",
  "severity": "error",
  "message": "Must be 2-10 letters"
}
```

#### `enum`
Validates that value is one of the allowed values.

```json
{
  "type": "enum",
  "values": ["Bug", "Feature", "Task"],
  "severity": "error",
  "message": "Must be a valid issue type"
}
```

#### `custom`
Uses a custom validation function.

```json
{
  "type": "custom",
  "validator": "myCustomValidator",
  "severity": "warning",
  "message": "Custom validation failed"
}
```

### Severity Levels

- `error`: Validation failure, ticket should not be created
- `warning`: Recommendation, ticket can be created but improvements suggested
- `info`: Informational message
- `hint`: Subtle suggestion

## Ticketing Systems

### Jira

Jira tickets use a nested field structure:

```json
{
  "fields": {
    "summary": "Task title",
    "description": "Task description",
    "project": { "key": "PROJ" },
    "issuetype": { "name": "Task" },
    "priority": { "name": "High" },
    "labels": ["backend", "api"]
  }
}
```

Field paths for validation:
- `fields.summary` - Ticket title
- `fields.description` - Ticket description
- `fields.project.key` - Project key
- `fields.issuetype.name` - Issue type
- `fields.priority.name` - Priority level
- `fields.labels` - Labels array

### Linear

Linear tickets use a flat structure:

```json
{
  "teamId": "uuid-here",
  "title": "Task title",
  "description": "Task description",
  "priorityLabel": "High",
  "labelIds": ["label-id-1", "label-id-2"],
  "estimate": 3
}
```

Field paths:
- `teamId` - Team UUID
- `title` - Issue title
- `description` - Issue description
- `priorityLabel` - Priority level
- `estimate` - Story points
- `labelIds` - Label IDs array

### GitHub Issues

GitHub issues use a repository-based structure:

```json
{
  "owner": "username",
  "repo": "repository",
  "title": "Issue title",
  "body": "Issue description",
  "labels": ["bug", "priority:high"],
  "assignees": ["username1", "username2"]
}
```

Field paths:
- `owner` - Repository owner
- `repo` - Repository name
- `title` - Issue title
- `body` - Issue description
- `labels` - Labels array
- `assignees` - Assignee usernames

## AI Agent Integration

This LSP is designed to work seamlessly with AI agents creating tickets:

```typescript
import { createValidator, getTemplate, loadConfig } from '@neural-tools/lsp-ticket-validator';

// In your agent workflow
async function createTicketWithValidation(ticketData: any) {
  const config = loadConfig();
  const template = getTemplate(config, 'My Jira Template');
  const validator = createValidator(template);

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const result = validator.validate(ticketData);

    if (result.valid) {
      // Create the ticket in the actual system
      await createJiraTicket(ticketData);
      return { success: true };
    }

    // Send feedback to the AI model
    const feedback = validator.generateFeedback(result);

    // Let the model fix the issues
    ticketData = await askModelToFix(ticketData, feedback);
    attempts++;
  }

  return { success: false, message: 'Failed to create valid ticket' };
}
```

## Default Templates

The package includes default templates for all supported systems:

```typescript
import {
  createDefaultJiraTemplate,
  createDefaultLinearTemplate,
  createDefaultGitHubTemplate,
  createDefaultGenericTemplate,
} from '@neural-tools/lsp-ticket-validator';

const jiraTemplate = createDefaultJiraTemplate();
const linearTemplate = createDefaultLinearTemplate();
const githubTemplate = createDefaultGitHubTemplate();
const genericTemplate = createDefaultGenericTemplate();
```

## Custom Validators

Add custom validation logic:

```typescript
import { TicketTemplate, ValidationRuleType } from '@neural-tools/lsp-ticket-validator';

const template: TicketTemplate = {
  name: 'Custom Template',
  system: 'jira',
  fields: [
    {
      path: 'fields.customField',
      label: 'Custom Field',
      rules: [
        {
          type: ValidationRuleType.CUSTOM,
          validator: 'validateBusinessLogic',
          severity: 'error',
        },
      ],
    },
  ],
  customValidators: {
    validateBusinessLogic: (value: any) => {
      // Return true if valid
      if (isValidBusinessValue(value)) {
        return true;
      }
      // Return false or error message if invalid
      return 'Business validation failed: value does not meet criteria';
    },
  },
};
```

## API Reference

### Classes

- `BaseTicketValidator` - Abstract base class for all validators
- `JiraTicketValidator` - Jira-specific validator
- `LinearTicketValidator` - Linear-specific validator
- `GitHubIssueValidator` - GitHub Issues validator
- `GenericTicketValidator` - Generic validator for any system

### Functions

- `createValidator(template)` - Create a validator instance
- `getDefaultTemplate(system)` - Get default template for a system
- `loadConfig(path?)` - Load configuration from file
- `saveConfig(config, path)` - Save configuration to file
- `getTemplate(config, name)` - Get template by name

### Types

- `Ticket` - Generic ticket interface
- `TicketTemplate` - Template configuration
- `ValidationRule` - Validation rule definition
- `TicketValidationResult` - Validation result
- `FieldValidationResult` - Field-level validation result

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.
