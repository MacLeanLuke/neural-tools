import { VectorDBConfig, VectorStore } from './types';
import { LocalVectorStore } from './local-store';
import { requireFeature } from '@neural-tools/core';

export * from './types';
export { LocalVectorStore } from './local-store';

/**
 * Create a vector store instance based on the configuration
 */
export async function createVectorStore(config: VectorDBConfig): Promise<VectorStore> {
  switch (config.provider) {
    case 'local':
      return new LocalVectorStore(config);

    case 'pinecone':
      await requireFeature('vector-db', 'Vector Database Integration');
      throw new Error('Pinecone integration coming soon. Use local provider for now.');

    case 'qdrant':
      await requireFeature('vector-db', 'Vector Database Integration');
      throw new Error('Qdrant integration coming soon. Use local provider for now.');

    case 'chromadb':
      await requireFeature('vector-db', 'Vector Database Integration');
      throw new Error('ChromaDB integration coming soon. Use local provider for now.');

    default:
      throw new Error(`Unknown vector store provider: ${config.provider}`);
  }
}

/**
 * Helper function to create embeddings from text
 * In production, this would call OpenAI, Anthropic, or other embedding APIs
 */
export async function createEmbedding(text: string): Promise<number[]> {
  // Placeholder: Simple hash-based embedding for testing
  // In production, use proper embedding models
  const hash = simpleHash(text);
  const dimension = 384; // Common embedding dimension
  const embedding = new Array(dimension).fill(0);

  // Create a deterministic but distributed embedding from hash
  for (let i = 0; i < dimension; i++) {
    embedding[i] = Math.sin(hash + i) * Math.cos(hash / (i + 1));
  }

  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / norm);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Batch text into chunks for embedding
 */
export function chunkText(
  text: string,
  options: { chunkSize?: number; overlap?: number } = {}
): string[] {
  const chunkSize = options.chunkSize || 500;
  const overlap = options.overlap || 50;
  const chunks: string[] = [];

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}
