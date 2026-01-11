import { requireFeature } from '@neural-tools/core';
import fs from 'fs/promises';
import path from 'path';

export interface FineTuneConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  datasetPath: string;
  validationSplit?: number;
  epochs?: number;
  learningRate?: number;
  batchSize?: number;
}

export interface TrainingExample {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export interface FineTuneJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  model: string;
  trainingFile?: string;
  validationFile?: string;
  createdAt: number;
  finishedAt?: number;
  error?: string;
}

/**
 * Prepare training data for fine-tuning
 */
export async function prepareTrainingData(
  examples: TrainingExample[],
  options: {
    validationSplit?: number;
    outputDir?: string;
  } = {}
): Promise<{ trainingFile: string; validationFile?: string }> {
  await requireFeature('fine-tuning', 'Fine-tuning');

  const validationSplit = options.validationSplit || 0;
  const outputDir = options.outputDir || './fine-tune-data';

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Split data
  const splitIndex = Math.floor(examples.length * (1 - validationSplit));
  const trainingExamples = examples.slice(0, splitIndex);
  const validationExamples = validationSplit > 0 ? examples.slice(splitIndex) : [];

  // Write training file
  const trainingFile = path.join(outputDir, 'training.jsonl');
  const trainingContent = trainingExamples
    .map(ex => JSON.stringify(ex))
    .join('\n');
  await fs.writeFile(trainingFile, trainingContent, 'utf-8');

  // Write validation file if needed
  let validationFile: string | undefined;
  if (validationExamples.length > 0) {
    validationFile = path.join(outputDir, 'validation.jsonl');
    const validationContent = validationExamples
      .map(ex => JSON.stringify(ex))
      .join('\n');
    await fs.writeFile(validationFile, validationContent, 'utf-8');
  }

  return { trainingFile, validationFile };
}

/**
 * Validate training data format
 */
export function validateTrainingData(examples: TrainingExample[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (examples.length === 0) {
    errors.push('No training examples provided');
    return { valid: false, errors };
  }

  examples.forEach((example, index) => {
    if (!example.messages || !Array.isArray(example.messages)) {
      errors.push(`Example ${index}: Missing or invalid messages array`);
      return;
    }

    if (example.messages.length === 0) {
      errors.push(`Example ${index}: Messages array is empty`);
    }

    example.messages.forEach((message, msgIndex) => {
      if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
        errors.push(`Example ${index}, Message ${msgIndex}: Invalid role`);
      }

      if (!message.content || typeof message.content !== 'string') {
        errors.push(`Example ${index}, Message ${msgIndex}: Missing or invalid content`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a fine-tune job (placeholder - actual implementation would call provider APIs)
 */
export async function createFineTuneJob(config: FineTuneConfig): Promise<FineTuneJob> {
  await requireFeature('fine-tuning', 'Fine-tuning');

  // Validate dataset exists
  try {
    await fs.access(config.datasetPath);
  } catch {
    throw new Error(`Dataset file not found: ${config.datasetPath}`);
  }

  // In production, this would:
  // 1. Upload training data to provider
  // 2. Start fine-tuning job
  // 3. Return job details

  const job: FineTuneJob = {
    id: `ft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    model: config.model,
    trainingFile: config.datasetPath,
    createdAt: Date.now()
  };

  return job;
}

/**
 * Get fine-tune job status (placeholder)
 */
export async function getFineTuneJob(jobId: string): Promise<FineTuneJob> {
  await requireFeature('fine-tuning', 'Fine-tuning');

  // In production, this would query the provider API
  throw new Error('Fine-tune job tracking coming soon');
}

/**
 * Convert conversations to training examples
 */
export function conversationsToExamples(
  conversations: Array<{
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }>
): TrainingExample[] {
  return conversations.map(conv => {
    const messages: TrainingExample['messages'] = [];

    if (conv.system) {
      messages.push({
        role: 'system',
        content: conv.system
      });
    }

    messages.push(...conv.messages);

    return { messages };
  });
}

/**
 * Calculate dataset statistics
 */
export function analyzeDataset(examples: TrainingExample[]): {
  totalExamples: number;
  avgMessagesPerExample: number;
  avgTokensPerMessage: number;
  roleDistribution: Record<string, number>;
} {
  const stats = {
    totalExamples: examples.length,
    avgMessagesPerExample: 0,
    avgTokensPerMessage: 0,
    roleDistribution: {} as Record<string, number>
  };

  let totalMessages = 0;
  let totalTokens = 0;

  examples.forEach(example => {
    totalMessages += example.messages.length;

    example.messages.forEach(message => {
      // Simple token estimation (real implementation would use tiktoken)
      const tokens = message.content.split(/\s+/).length;
      totalTokens += tokens;

      stats.roleDistribution[message.role] =
        (stats.roleDistribution[message.role] || 0) + 1;
    });
  });

  stats.avgMessagesPerExample = totalMessages / examples.length;
  stats.avgTokensPerMessage = totalTokens / totalMessages;

  return stats;
}
