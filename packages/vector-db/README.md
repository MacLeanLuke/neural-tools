# @neural-tools/vector-db

> Vector database abstraction layer for Neural Tools

[![npm version](https://img.shields.io/npm/v/@neural-tools/vector-db)](https://www.npmjs.com/package/@neural-tools/vector-db)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE.md)

Unified interface for working with vector databases. Supports Pinecone, Chroma, Qdrant, and a local in-memory store.

## Installation

```bash
npm install @neural-tools/vector-db
```

### With Pinecone

```bash
npm install @neural-tools/vector-db @pinecone-database/pinecone
```

### With Chroma

```bash
npm install @neural-tools/vector-db chromadb
```

### With Qdrant

```bash
npm install @neural-tools/vector-db @qdrant/js-client-rest
```

## Features

- **Unified API** - Same interface for all vector databases
- **Multiple Providers** - Pinecone, Chroma, Qdrant, local storage
- **Type-Safe** - Full TypeScript support
- **Easy Switching** - Change providers without code changes
- **Local Development** - In-memory store for testing

## Quick Start

### Using Pinecone

```typescript
import { VectorDB } from '@neural-tools/vector-db';

const db = new VectorDB({
  provider: 'pinecone',
  config: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: 'us-west1-gcp',
    indexName: 'my-index'
  }
});

await db.connect();

// Insert vectors
await db.upsert([
  {
    id: '1',
    values: [0.1, 0.2, 0.3, ...],
    metadata: { text: 'Hello world', category: 'greeting' }
  }
]);

// Query
const results = await db.query({
  vector: [0.1, 0.2, 0.3, ...],
  topK: 5,
  filter: { category: 'greeting' }
});
```

### Using Local Store (Development)

```typescript
import { VectorDB } from '@neural-tools/vector-db';

const db = new VectorDB({
  provider: 'local',
  config: {
    dimension: 1536  // Embedding dimension
  }
});

await db.connect();

// Same API as other providers
await db.upsert([...]);
const results = await db.query({...});
```

### Using Chroma

```typescript
import { VectorDB } from '@neural-tools/vector-db';

const db = new VectorDB({
  provider: 'chroma',
  config: {
    url: 'http://localhost:8000',
    collectionName: 'my-collection'
  }
});

await db.connect();
```

### Using Qdrant

```typescript
import { VectorDB } from '@neural-tools/vector-db';

const db = new VectorDB({
  provider: 'qdrant',
  config: {
    url: 'http://localhost:6333',
    collectionName: 'my-collection',
    apiKey: process.env.QDRANT_API_KEY  // Optional
  }
});

await db.connect();
```

## API Reference

### Constructor

```typescript
new VectorDB(options: VectorDBOptions)

interface VectorDBOptions {
  provider: 'pinecone' | 'chroma' | 'qdrant' | 'local';
  config: ProviderConfig;
}
```

### Methods

#### `connect()`

Connect to the vector database.

```typescript
await db.connect();
```

#### `disconnect()`

Disconnect from the database.

```typescript
await db.disconnect();
```

#### `upsert(vectors)`

Insert or update vectors.

```typescript
await db.upsert([
  {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }
]);
```

#### `query(options)`

Search for similar vectors.

```typescript
const results = await db.query({
  vector: number[];      // Query vector
  topK: number;         // Number of results
  filter?: object;      // Metadata filter
  includeMetadata?: boolean;
  includeValues?: boolean;
});

// Returns
interface QueryResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, any>;
}
```

#### `delete(ids)`

Delete vectors by ID.

```typescript
await db.delete(['id1', 'id2']);
```

#### `fetch(ids)`

Retrieve vectors by ID.

```typescript
const vectors = await db.fetch(['id1', 'id2']);
```

## Configuration

### Pinecone

```typescript
{
  provider: 'pinecone',
  config: {
    apiKey: string;
    environment: string;
    indexName: string;
    namespace?: string;
  }
}
```

### Chroma

```typescript
{
  provider: 'chroma',
  config: {
    url: string;
    collectionName: string;
    auth?: {
      provider: string;
      credentials: string;
    };
  }
}
```

### Qdrant

```typescript
{
  provider: 'qdrant',
  config: {
    url: string;
    collectionName: string;
    apiKey?: string;
  }
}
```

### Local (In-Memory)

```typescript
{
  provider: 'local',
  config: {
    dimension: number;  // Vector dimension
  }
}
```

## Examples

### Semantic Search

```typescript
import { VectorDB } from '@neural-tools/vector-db';
import { embed } from './embeddings';  // Your embedding function

const db = new VectorDB({
  provider: 'pinecone',
  config: { /* ... */ }
});

await db.connect();

// Index documents
const documents = [
  'Neural Tools is amazing',
  'I love building with AI',
  'Vector databases are powerful'
];

for (const [i, doc] of documents.entries()) {
  const embedding = await embed(doc);
  await db.upsert([{
    id: `doc-${i}`,
    values: embedding,
    metadata: { text: doc }
  }]);
}

// Search
const queryEmbedding = await embed('AI development tools');
const results = await db.query({
  vector: queryEmbedding,
  topK: 2,
  includeMetadata: true
});

console.log(results);
// [
//   { id: 'doc-0', score: 0.95, metadata: { text: 'Neural Tools is amazing' } },
//   { id: 'doc-1', score: 0.87, metadata: { text: 'I love building with AI' } }
// ]
```

### Filtered Search

```typescript
await db.query({
  vector: queryVector,
  topK: 10,
  filter: {
    category: 'documentation',
    published: true,
    date: { $gte: '2024-01-01' }
  }
});
```

### Batch Operations

```typescript
// Batch insert
await db.upsert(
  Array.from({ length: 1000 }, (_, i) => ({
    id: `vector-${i}`,
    values: generateVector(),
    metadata: { index: i }
  }))
);

// Batch delete
await db.delete(
  Array.from({ length: 100 }, (_, i) => `vector-${i}`)
);
```

## Environment Variables

```bash
# Pinecone
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=my-index

# Chroma
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=my-collection

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-api-key
QDRANT_COLLECTION=my-collection
```

## Testing

The local provider is perfect for testing:

```typescript
import { VectorDB } from '@neural-tools/vector-db';

describe('Vector operations', () => {
  let db: VectorDB;

  beforeEach(async () => {
    db = new VectorDB({
      provider: 'local',
      config: { dimension: 1536 }
    });
    await db.connect();
  });

  it('should insert and query', async () => {
    await db.upsert([{
      id: '1',
      values: new Array(1536).fill(0.1),
      metadata: { test: true }
    }]);

    const results = await db.query({
      vector: new Array(1536).fill(0.1),
      topK: 1
    });

    expect(results[0].id).toBe('1');
  });
});
```

## Dependencies

- [@neural-tools/core](../core) - Core utilities

### Peer Dependencies (Optional)

- `@pinecone-database/pinecone` - For Pinecone support
- `chromadb` - For Chroma support
- `@qdrant/js-client-rest` - For Qdrant support

## Contributing

Contributions are welcome! See the [main repository](https://github.com/MacLeanLuke/neural-tools) for guidelines.

## License

MIT - See [LICENSE.md](../../LICENSE.md) for details.

## Links

- [Documentation](https://neural-tools.com/docs/vector-db.html)
- [GitHub](https://github.com/MacLeanLuke/neural-tools)
- [npm](https://www.npmjs.com/package/@neural-tools/vector-db)
