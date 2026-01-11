import { VectorStore, Vector, QueryResult, QueryOptions, UpsertOptions } from './types';

/**
 * Simple in-memory vector store for local development and testing
 */
export class LocalVectorStore extends VectorStore {
  private vectors: Map<string, Vector> = new Map();

  async connect(): Promise<void> {
    // No connection needed for local store
  }

  async upsert(vectors: Vector[], options?: UpsertOptions): Promise<void> {
    for (const vector of vectors) {
      this.vectors.set(vector.id, vector);
    }
  }

  async query(vector: number[], options?: QueryOptions): Promise<QueryResult[]> {
    const topK = options?.topK || 10;
    const results: QueryResult[] = [];

    // Calculate similarity for all vectors
    for (const [id, storedVector] of this.vectors) {
      // Skip if filter doesn't match
      if (options?.filter && !this.matchesFilter(storedVector.metadata, options.filter)) {
        continue;
      }

      const score = this.cosineSimilarity(vector, storedVector.values);
      results.push({
        id,
        score,
        metadata: options?.includeMetadata !== false ? storedVector.metadata : undefined,
        values: options?.includeValues ? storedVector.values : undefined
      });
    }

    // Sort by score descending and take topK
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.vectors.delete(id);
    }
  }

  async fetch(ids: string[]): Promise<Vector[]> {
    const results: Vector[] = [];
    for (const id of ids) {
      const vector = this.vectors.get(id);
      if (vector) {
        results.push(vector);
      }
    }
    return results;
  }

  async deleteNamespace(): Promise<void> {
    this.vectors.clear();
  }

  async disconnect(): Promise<void> {
    // No cleanup needed for local store
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Check if metadata matches filter
   */
  private matchesFilter(
    metadata: Record<string, any> | undefined,
    filter: Record<string, any>
  ): boolean {
    if (!metadata) return false;

    for (const [key, value] of Object.entries(filter)) {
      if (metadata[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all vectors (for testing/debugging)
   */
  getAll(): Vector[] {
    return Array.from(this.vectors.values());
  }

  /**
   * Get count of vectors
   */
  count(): number {
    return this.vectors.size;
  }
}
