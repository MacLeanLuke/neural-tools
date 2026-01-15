# @neural-tools/core

> Core utilities and types for Neural Tools

[![npm version](https://img.shields.io/npm/v/@neural-tools/core)](https://www.npmjs.com/package/@neural-tools/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE.md)

Shared utilities, types, and functions used across all Neural Tools packages.

## Installation

```bash
npm install @neural-tools/core
```

## Features

- **Logger** - Beautiful CLI logging with colors and spinners
- **Types** - TypeScript types and Zod schemas
- **License Management** - Feature checking and validation
- **Utilities** - Common helper functions

## Usage

### Logger

Formatted console output with colors and loading indicators.

```typescript
import { logger } from '@neural-tools/core';

// Headers and sections
logger.header('My Application');
logger.section('Configuration', [
  'Environment: production',
  'Region: us-east-1'
]);

// Status messages
logger.success('Operation completed!');
logger.error('Something went wrong');
logger.warning('This is a warning');
logger.info('Informational message');

// Spinners
logger.startSpinner('Processing...');
// ... do work ...
logger.succeedSpinner('Done!');
// or
logger.failSpinner('Failed');

// New lines
logger.newline();
```

### Types

TypeScript types and Zod schemas for validation.

```typescript
import {
  License,
  LicenseTier,
  MCPConfig,
  ClaudeCommandConfig
} from '@neural-tools/core';

// License types
const license: License = {
  tier: LicenseTier.FREE,
  features: ['mcp-generation', 'claude-commands']
};

// MCP configuration
const mcpConfig: MCPConfig = {
  name: 'my-mcp',
  description: 'My MCP server',
  version: '1.0.0',
  license: 'MIT'
};

// Claude command configuration
const commandConfig: ClaudeCommandConfig = {
  name: 'my-command',
  description: 'My command',
  content: 'Command prompt content...'
};
```

### License Management

Check feature availability (all features are enabled by default).

```typescript
import {
  checkFeature,
  requireFeature,
  licenseManager
} from '@neural-tools/core';

// Check if a feature is available
const hasVectorDB = await checkFeature('vector-db');
// Returns: true (all features are free)

// Require a feature (throws if not available)
await requireFeature('cloud-deployment', 'Cloud Deployment');
// Does not throw - all features are available

// Get current tier
const tier = await licenseManager.getTier();
```

## API Reference

### Logger Methods

| Method | Description |
|--------|-------------|
| `header(text)` | Display a large header |
| `section(title, items)` | Display a titled section with items |
| `success(message)` | Green success message |
| `error(message)` | Red error message |
| `warning(message)` | Yellow warning message |
| `info(message)` | Blue info message |
| `startSpinner(text)` | Start loading spinner |
| `succeedSpinner(text?)` | Complete spinner with success |
| `failSpinner(text?)` | Complete spinner with failure |
| `newline()` | Add blank line |

### Type Exports

```typescript
// License types
export enum LicenseTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface License {
  tier: LicenseTier;
  email?: string;
  key?: string;
  expiresAt?: string;
  features: string[];
}

// Configuration types
export interface MCPConfig {
  name: string;
  description: string;
  version: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license: string;
  fastmcp?: {
    tools: string[];
    prompts: string[];
    resources: string[];
  };
}

export interface ClaudeCommandConfig {
  name: string;
  description: string;
  argumentHint?: string;
  allowedTools?: string[];
  content: string;
}
```

### License Manager

```typescript
class LicenseManager {
  // Load license from disk
  async loadLicense(): Promise<License>

  // Save license to disk
  async saveLicense(license: License): Promise<void>

  // Check if feature is available (always returns true)
  async checkFeature(feature: string): Promise<boolean>

  // Require feature (no-op, all features available)
  async requireFeature(feature: string, featureName?: string): Promise<void>

  // Get current license tier
  async getTier(): Promise<LicenseTier>
}

// Singleton instance
export const licenseManager: LicenseManager
```

## Dependencies

- **zod** - Schema validation
- **chalk** - Terminal colors
- **ora** - Terminal spinners

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev
```

## Used By

- [@neural-tools/cli](../cli) - Main CLI tool
- [@neural-tools/create](../create-ai-toolkit) - Project scaffolding
- [@neural-tools/vector-db](../vector-db) - Vector database utilities
- [@neural-tools/semantic-cache](../semantic-cache) - Semantic caching
- [@neural-tools/fine-tune](../fine-tune) - Fine-tuning utilities

## Contributing

Contributions are welcome! See the [main repository](https://github.com/MacLeanLuke/neural-tools) for guidelines.

## License

MIT - See [LICENSE.md](../../LICENSE.md) for details.

## Links

- [Documentation](https://neural-tools.com/docs/core.html)
- [GitHub](https://github.com/MacLeanLuke/neural-tools)
- [npm](https://www.npmjs.com/package/@neural-tools/core)
