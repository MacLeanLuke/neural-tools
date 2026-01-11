import { createVectorStore, createEmbedding, VectorStore } from '@neural-tools/vector-db';
import { requireFeature } from '@neural-tools/core';

export interface SemanticCacheConfig {
  /**
   * Similarity threshold (0-1). Higher = more strict matching.
   * Default: 0.95
   */
  similarityThreshold?: number;

  /**
   * Time to live in seconds. 0 = never expire.
   * Default: 3600 (1 hour)
   */
  ttl?: number;

  /**
   * Vector store provider
   * Default: 'local'
   */
  provider?: 'local' | 'pinecone' | 'qdrant' | 'chromadb';

  /**
   * Vector database configuration
   */
  vectorDBConfig?: any;
}

export interface CacheEntry {
  prompt: string;
  response: string;
  metadata?: Record<string, any>;
  timestamp: number;
  ttl?: number;
}

export class SemanticCache {
  private vectorStore: VectorStore | null = null;
  private config: Required<SemanticCacheConfig>;
  private initialized = false;

  constructor(config: SemanticCacheConfig = {}) {
    this.config = {
      similarityThreshold: config.similarityThreshold || 0.95,
      ttl: config.ttl || 3600,
      provider: config.provider || 'local',
      vectorDBConfig: config.vectorDBConfig || {}
    };
  }

  /**
   * Initialize the semantic cache
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check feature access for non-local providers
    if (this.config.provider !== 'local') {
      await requireFeature('semantic-cache', 'Semantic Cache');
    }

    this.vectorStore = await createVectorStore({
      provider: this.config.provider,
      ...this.config.vectorDBConfig
    });

    await this.vectorStore.connect();
    this.initialized = true;
  }

  /**
   * Get a cached response for a prompt
   */
  async get(prompt: string): Promise<string | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    // Create embedding for the prompt
    const embedding = await createEmbedding(prompt);

    // Query for similar prompts
    const results = await this.vectorStore.query(embedding, {
      topK: 1,
      includeMetadata: true
    });

    if (results.length === 0) {
      return null;
    }

    const bestMatch = results[0];

    // Check similarity threshold
    if (bestMatch.score < this.config.similarityThreshold) {
      return null;
    }

    // Check if expired
    const entry = bestMatch.metadata as CacheEntry;
    if (entry.ttl && entry.ttl > 0) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl * 1000) {
        // Entry expired, delete it
        await this.vectorStore.delete([bestMatch.id]);
        return null;
      }
    }

    return entry.response;
  }

  /**
   * Set a cache entry
   */
  async set(
    prompt: string,
    response: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    // Create embedding for the prompt
    const embedding = await createEmbedding(prompt);

    // Create cache entry
    const entry: CacheEntry = {
      prompt,
      response,
      metadata,
      timestamp: Date.now(),
      ttl: this.config.ttl
    };

    // Store in vector database
    const id = `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.vectorStore.upsert([
      {
        id,
        values: embedding,
        metadata: entry
      }
    ]);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    await this.vectorStore.deleteNamespace('default');
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    // This is a simplified cleanup - in production, you'd want to
    // query all vectors and check their TTL
    // For now, we'll return 0 as a placeholder
    return 0;
  }

  /**
   * Close the cache connection
   */
  async close(): Promise<void> {
    if (this.vectorStore) {
      await this.vectorStore.disconnect();
    }
    this.initialized = false;
  }
}

/**
 * Create a semantic cache instance
 */
export function createSemanticCache(config?: SemanticCacheConfig): SemanticCache {
  return new SemanticCache(config);
}
