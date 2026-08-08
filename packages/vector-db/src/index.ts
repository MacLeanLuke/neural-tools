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
 * Hash-based stand-in for an embedding. NOT a semantic embedding.
 *
 * It maps a string hash across 384 dimensions, so the output is deterministic
 * per exact input and carries no meaning. Measured cosine similarity:
 *
 *   identical strings          1.00
 *   one character different    0.55
 *   paraphrase of each other  -0.02
 *   completely unrelated      -0.02
 *
 * Because paraphrases and unrelated text are indistinguishable, any threshold
 * high enough to avoid false hits also rejects every paraphrase — the cache
 * degrades to exact string matching. Supply a real embedding model instead;
 * see SemanticCacheConfig.embedder.
 *
 * @deprecated Kept for tests and offline development only.
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
