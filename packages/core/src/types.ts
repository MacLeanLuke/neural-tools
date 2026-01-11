import { z } from 'zod';

// License tiers
export enum LicenseTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// License schema
export const LicenseSchema = z.object({
  tier: z.nativeEnum(LicenseTier),
  email: z.string().email().optional(),
  key: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  features: z.array(z.string()).default([])
});

export type License = z.infer<typeof LicenseSchema>;

// MCP Configuration
export const MCPConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().default('MIT'),
  fastmcp: z.object({
    tools: z.array(z.string()).default([]),
    prompts: z.array(z.string()).default([]),
    resources: z.array(z.string()).default([])
  }).optional()
});

export type MCPConfig = z.infer<typeof MCPConfigSchema>;

// Claude Command Configuration
export const ClaudeCommandConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  argumentHint: z.string().optional(),
  allowedTools: z.array(z.string()).optional(),
  content: z.string()
});

export type ClaudeCommandConfig = z.infer<typeof ClaudeCommandConfigSchema>;

// Generator Options
export interface GeneratorOptions {
  name: string;
  description?: string;
  outputDir?: string;
  template?: string;
  dryRun?: boolean;
}

export interface MCPGeneratorOptions extends GeneratorOptions {
  fastmcp?: boolean;
  cicd?: 'github' | 'harness' | 'none';
  deployment?: 'aws' | 'gcp' | 'none';
}

export interface ClaudeCommandGeneratorOptions extends GeneratorOptions {
  arguments?: string[];
  allowedTools?: string[];
  installGlobally?: boolean;
}

// Vector DB Configuration
export interface VectorDBConfig {
  provider: 'pinecone' | 'qdrant' | 'chromadb' | 'local';
  apiKey?: string;
  endpoint?: string;
  dimension?: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
}

// Semantic Cache Configuration
export interface SemanticCacheConfig {
  enabled: boolean;
  ttl?: number; // Time to live in seconds
  similarityThreshold?: number; // 0-1, default 0.95
  vectorDB?: VectorDBConfig;
}

// Fine-tuning Configuration
export interface FineTuneConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  datasetPath: string;
  validationSplit?: number;
  epochs?: number;
  learningRate?: number;
}
