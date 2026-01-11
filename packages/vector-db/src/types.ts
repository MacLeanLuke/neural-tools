export interface VectorDBConfig {
  provider: 'pinecone' | 'qdrant' | 'chromadb' | 'local';
  apiKey?: string;
  endpoint?: string;
  dimension?: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
  namespace?: string;
}

export interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  values?: number[];
}

export interface QueryOptions {
  topK?: number;
  filter?: Record<string, any>;
  includeValues?: boolean;
  includeMetadata?: boolean;
}

export interface UpsertOptions {
  namespace?: string;
  batch?: boolean;
}

export abstract class VectorStore {
  protected config: VectorDBConfig;

  constructor(config: VectorDBConfig) {
    this.config = config;
  }

  /**
   * Initialize the vector store connection
   */
  abstract connect(): Promise<void>;

  /**
   * Insert or update vectors
   */
  abstract upsert(vectors: Vector[], options?: UpsertOptions): Promise<void>;

  /**
   * Query for similar vectors
   */
  abstract query(
    vector: number[],
    options?: QueryOptions
  ): Promise<QueryResult[]>;

  /**
   * Delete vectors by ID
   */
  abstract delete(ids: string[], namespace?: string): Promise<void>;

  /**
   * Get vector by ID
   */
  abstract fetch(ids: string[], namespace?: string): Promise<Vector[]>;

  /**
   * Delete all vectors in a namespace
   */
  abstract deleteNamespace(namespace: string): Promise<void>;

  /**
   * Close the connection
   */
  abstract disconnect(): Promise<void>;
}
