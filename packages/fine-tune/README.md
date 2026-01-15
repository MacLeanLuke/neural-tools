# @neural-tools/fine-tune

> Fine-tuning utilities for Neural Tools

[![npm version](https://img.shields.io/npm/v/@neural-tools/fine-tune)](https://www.npmjs.com/package/@neural-tools/fine-tune)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE.md)

Utilities for preparing, validating, and managing fine-tuning datasets for LLMs. Currently supports OpenAI's fine-tuning format.

## Installation

```bash
npm install @neural-tools/fine-tune
```

### With OpenAI

```bash
npm install @neural-tools/fine-tune openai
```

## Features

- **Dataset Preparation** - Convert various formats to fine-tuning format
- **Validation** - Ensure datasets meet LLM requirements
- **Cost Estimation** - Calculate fine-tuning costs before running
- **Quality Analysis** - Analyze dataset quality and balance
- **Format Conversion** - Convert between different training formats
- **Token Counting** - Accurate token counting for cost estimation

## Quick Start

```typescript
import { FineTuneDataset } from '@neural-tools/fine-tune';

// Create dataset
const dataset = new FineTuneDataset();

// Add training examples
dataset.addExample({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
    { role: 'assistant', content: 'The capital of France is Paris.' }
  ]
});

dataset.addExample({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is 2 + 2?' },
    { role: 'assistant', content: '2 + 2 equals 4.' }
  ]
});

// Validate dataset
const validation = await dataset.validate();
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Get cost estimate
const estimate = await dataset.estimateCost('gpt-3.5-turbo');
console.log(`Estimated cost: $${estimate.totalCost.toFixed(2)}`);

// Export for OpenAI
const jsonl = dataset.toJSONL();
await fs.writeFile('training-data.jsonl', jsonl);
```

## API Reference

### FineTuneDataset

Main class for managing fine-tuning datasets.

#### Constructor

```typescript
new FineTuneDataset(options?: DatasetOptions)

interface DatasetOptions {
  format?: 'openai' | 'anthropic';  // Default: 'openai'
  validateOnAdd?: boolean;           // Default: true
}
```

#### Methods

##### `addExample(example)`

Add a training example to the dataset.

```typescript
dataset.addExample({
  messages: [
    { role: 'system', content: 'System prompt' },
    { role: 'user', content: 'User message' },
    { role: 'assistant', content: 'Assistant response' }
  ]
});
```

##### `addExamples(examples)`

Add multiple examples at once.

```typescript
dataset.addExamples([
  { messages: [...] },
  { messages: [...] },
  { messages: [...] }
]);
```

##### `validate()`

Validate the dataset.

```typescript
const result = await dataset.validate();

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalExamples: number;
    avgTokensPerExample: number;
    minTokens: number;
    maxTokens: number;
  };
}
```

##### `estimateCost(model)`

Estimate fine-tuning cost.

```typescript
const estimate = await dataset.estimateCost('gpt-3.5-turbo');

interface CostEstimate {
  model: string;
  totalTokens: number;
  trainingCost: number;
  totalCost: number;
  estimatedTime: number;  // Minutes
}
```

##### `analyze()`

Get dataset quality metrics.

```typescript
const analysis = await dataset.analyze();

interface DatasetAnalysis {
  exampleCount: number;
  avgTokensPerMessage: number;
  tokenDistribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  roleBalance: {
    system: number;
    user: number;
    assistant: number;
  };
  qualityScore: number;  // 0-100
}
```

##### `toJSONL()`

Export dataset as JSONL string.

```typescript
const jsonl = dataset.toJSONL();
```

##### `toJSON()`

Export dataset as JSON array.

```typescript
const json = dataset.toJSON();
```

##### `fromJSONL(jsonl)`

Load dataset from JSONL string.

```typescript
dataset.fromJSONL(jsonlString);
```

##### `fromJSON(json)`

Load dataset from JSON array.

```typescript
dataset.fromJSON(jsonArray);
```

## Usage Examples

### Basic Chat Fine-Tuning

```typescript
import { FineTuneDataset } from '@neural-tools/fine-tune';

const dataset = new FineTuneDataset();

// Add customer support examples
const supportExamples = [
  {
    messages: [
      { role: 'system', content: 'You are a customer support agent.' },
      { role: 'user', content: 'How do I reset my password?' },
      { role: 'assistant', content: 'To reset your password: 1. Go to login page, 2. Click "Forgot Password", 3. Check your email for reset link.' }
    ]
  },
  {
    messages: [
      { role: 'system', content: 'You are a customer support agent.' },
      { role: 'user', content: 'My order hasn\'t arrived yet.' },
      { role: 'assistant', content: 'I can help track your order. Can you provide your order number?' }
    ]
  }
  // Add 50-100 more examples for good results
];

dataset.addExamples(supportExamples);

// Validate
const validation = await dataset.validate();
if (validation.isValid) {
  // Save for upload
  const jsonl = dataset.toJSONL();
  await fs.writeFile('support-training.jsonl', jsonl);
}
```

### Code Generation Fine-Tuning

```typescript
const dataset = new FineTuneDataset();

dataset.addExamples([
  {
    messages: [
      { role: 'system', content: 'You are a Python code generator.' },
      { role: 'user', content: 'Write a function to reverse a string' },
      { role: 'assistant', content: 'def reverse_string(s):\n    return s[::-1]' }
    ]
  },
  {
    messages: [
      { role: 'system', content: 'You are a Python code generator.' },
      { role: 'user', content: 'Create a function to check if number is prime' },
      { role: 'assistant', content: 'def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True' }
    ]
  }
]);
```

### Cost Estimation

```typescript
const dataset = new FineTuneDataset();
// ... add examples ...

// Estimate cost before running
const estimate = await dataset.estimateCost('gpt-3.5-turbo');

console.log(`Training ${dataset.size()} examples`);
console.log(`Total tokens: ${estimate.totalTokens}`);
console.log(`Estimated cost: $${estimate.totalCost.toFixed(2)}`);
console.log(`Estimated time: ${estimate.estimatedTime} minutes`);

// Only proceed if cost is acceptable
if (estimate.totalCost < 50) {
  await uploadAndTrain(dataset);
}
```

### Dataset Quality Analysis

```typescript
const analysis = await dataset.analyze();

console.log('Dataset Quality Report:');
console.log(`Examples: ${analysis.exampleCount}`);
console.log(`Avg tokens per message: ${analysis.avgTokensPerMessage}`);
console.log(`Quality score: ${analysis.qualityScore}/100`);

if (analysis.qualityScore < 70) {
  console.warn('Dataset quality is low. Add more diverse examples.');
}

if (analysis.exampleCount < 50) {
  console.warn('Dataset is small. Recommend at least 50-100 examples.');
}
```

### Format Conversion

```typescript
// Load from CSV
import { csvToFineTune } from '@neural-tools/fine-tune';

const csv = `
question,answer
"What is AI?","Artificial Intelligence is..."
"What is ML?","Machine Learning is..."
`;

const dataset = csvToFineTune(csv, {
  systemPrompt: 'You are a helpful AI tutor.',
  questionColumn: 'question',
  answerColumn: 'answer'
});

// Export to JSONL
const jsonl = dataset.toJSONL();
```

### Validation and Error Handling

```typescript
const dataset = new FineTuneDataset();
dataset.addExample({
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' }
  ]
});

const validation = await dataset.validate();

if (!validation.isValid) {
  console.error('Errors:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:');
  validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
}

console.log('Stats:', validation.stats);
```

## Fine-Tuning with OpenAI

```typescript
import OpenAI from 'openai';
import { FineTuneDataset } from '@neural-tools/fine-tune';
import fs from 'fs/promises';

const openai = new OpenAI();
const dataset = new FineTuneDataset();

// 1. Prepare dataset
dataset.addExamples([/* your examples */]);

// 2. Validate
const validation = await dataset.validate();
if (!validation.isValid) {
  throw new Error('Invalid dataset');
}

// 3. Save to file
const jsonl = dataset.toJSONL();
await fs.writeFile('training.jsonl', jsonl);

// 4. Upload file
const file = await openai.files.create({
  file: await fs.readFile('training.jsonl'),
  purpose: 'fine-tune'
});

// 5. Create fine-tuning job
const fineTune = await openai.fineTuning.jobs.create({
  training_file: file.id,
  model: 'gpt-3.5-turbo'
});

console.log(`Fine-tune job created: ${fineTune.id}`);
```

## Best Practices

### 1. Dataset Size

- Minimum: 10 examples (for testing)
- Recommended: 50-100 examples
- Optimal: 500+ examples

### 2. Example Quality

- Clear, consistent formatting
- Diverse scenarios
- Accurate, high-quality responses
- Balanced across use cases

### 3. Token Count

- Keep examples under 4096 tokens
- Aim for consistent lengths
- Monitor token distribution

### 4. System Prompts

```typescript
// Good: Specific, consistent
{ role: 'system', content: 'You are a Python expert who writes clean, documented code.' }

// Bad: Generic, vague
{ role: 'system', content: 'You are helpful.' }
```

## Pricing (as of 2024)

OpenAI fine-tuning costs:

- **GPT-3.5 Turbo**: ~$0.008 per 1K tokens
- **GPT-4**: ~$0.030 per 1K tokens

Example:
- 100 examples × 200 tokens = 20K tokens
- Cost: 20 × $0.008 = **$0.16** (GPT-3.5)

## Dependencies

- [@neural-tools/core](../core) - Core utilities

### Peer Dependencies

- `openai` - Optional, for OpenAI integration

## Contributing

Contributions are welcome! See the [main repository](https://github.com/MacLeanLuke/neural-tools) for guidelines.

## License

MIT - See [LICENSE.md](../../LICENSE.md) for details.

## Links

- [Documentation](https://neural-tools.com/docs/fine-tune.html)
- [GitHub](https://github.com/MacLeanLuke/neural-tools)
- [npm](https://www.npmjs.com/package/@neural-tools/fine-tune)
- [OpenAI Fine-Tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
