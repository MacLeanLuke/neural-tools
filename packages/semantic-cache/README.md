# @neural-tools/semantic-cache

> Semantic caching for LLM responses

[![npm version](https://img.shields.io/npm/v/@neural-tools/semantic-cache)](https://www.npmjs.com/package/@neural-tools/semantic-cache)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE.md)

Intelligent caching for LLM responses using semantic similarity. Save costs and improve response times by reusing similar completions.

## Installation

```bash
npm install @neural-tools/semantic-cache @neural-tools/vector-db
```

## Features

- **Semantic Matching** - Finds similar prompts, not just exact matches
- **Cost Savings** - Reduce API calls to expensive LLMs
- **Fast Responses** - Instant replies for cached queries
- **Configurable** - Adjust similarity threshold
- **Provider Agnostic** - Works with any vector database
- **TTL Support** - Automatic cache expiration

## Quick Start

```typescript
import { SemanticCache } from '@neural-tools/semantic-cache';
import { VectorDB } from '@neural-tools/vector-db';

// Setup vector database
const vectorDB = new VectorDB({
  provider: 'pinecone',
  config: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: 'us-west1-gcp',
    indexName: 'llm-cache'
  }
});

// Create semantic cache
const cache = new SemanticCache({
  vectorDB,
  similarityThreshold: 0.9,  // 0-1, higher = more similar
  ttl: 3600                   // Cache lifetime in seconds
});

await cache.initialize();

// Your embedding function
async function embed(text: string): Promise<number[]> {
  // Use OpenAI, Anthropic, or any embedding model
  // Return vector of embeddings
}

// Check cache before calling LLM
const prompt = "What is the capital of France?";
const embedding = await embed(prompt);

const cached = await cache.get(embedding);

if (cached) {
  console.log('Cache hit!', cached.response);
} else {
  // Call your LLM
  const response = await callLLM(prompt);

  // Store in cache
  await cache.set(embedding, {
    prompt,
    response,
    model: 'claude-3-opus',
    timestamp: Date.now()
  });
}
```

## API Reference

### Constructor

```typescript
new SemanticCache(options: SemanticCacheOptions)

interface SemanticCacheOptions {
  vectorDB: VectorDB;
  similarityThreshold?: number;  // Default: 0.9
  ttl?: number;                  // Seconds, default: 3600
  namespace?: string;
}
```

### Methods

#### `initialize()`

Initialize the cache and vector database connection.

```typescript
await cache.initialize();
```

#### `get(embedding)`

Retrieve a cached response for similar prompts.

```typescript
const result = await cache.get(embedding);

if (result) {
  console.log(result.response);
  console.log(result.similarity);  // How similar (0-1)
  console.log(result.metadata);
}
```

#### `set(embedding, data)`

Store a response in the cache.

```typescript
await cache.set(embedding, {
  prompt: string;
  response: string;
  model?: string;
  tokens?: number;
  timestamp?: number;
  metadata?: Record<string, any>;
});
```

#### `delete(id)`

Remove a specific cache entry.

```typescript
await cache.delete('cache-entry-id');
```

#### `clear()`

Clear all cached entries.

```typescript
await cache.clear();
```

#### `stats()`

Get cache statistics.

```typescript
const stats = await cache.stats();
console.log(stats);
// {
//   totalEntries: 1234,
//   hitRate: 0.75,
//   avgSimilarity: 0.92
// }
```

## Usage Examples

### With OpenAI

```typescript
import { SemanticCache } from '@neural-tools/semantic-cache';
import { VectorDB } from '@neural-tools/vector-db';
import OpenAI from 'openai';

const openai = new OpenAI();
const vectorDB = new VectorDB({ /* ... */ });
const cache = new SemanticCache({ vectorDB });

await cache.initialize();

async function completionWithCache(prompt: string) {
  // Get embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: prompt
  });
  const embedding = embeddingResponse.data[0].embedding;

  // Check cache
  const cached = await cache.get(embedding);
  if (cached) {
    console.log('Cache hit! Saved API call.');
    return cached.response;
  }

  // Call LLM
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });

  const response = completion.choices[0].message.content;

  // Cache the response
  await cache.set(embedding, {
    prompt,
    response,
    model: 'gpt-4',
    tokens: completion.usage?.total_tokens
  });

  return response;
}

// Use it
const answer = await completionWithCache('Explain quantum computing');
```

### With Anthropic Claude

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { SemanticCache } from '@neural-tools/semantic-cache';

const anthropic = new Anthropic();
const cache = new SemanticCache({ /* ... */ });

async function claudeWithCache(prompt: string) {
  const embedding = await getEmbedding(prompt);

  const cached = await cache.get(embedding);
  if (cached) return cached.response;

  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  const response = message.content[0].text;

  await cache.set(embedding, {
    prompt,
    response,
    model: 'claude-3-opus-20240229'
  });

  return response;
}
```

### Custom Similarity Threshold

```typescript
// Strict matching (0.95+)
const strictCache = new SemanticCache({
  vectorDB,
  similarityThreshold: 0.95
});

// Loose matching (0.80+)
const looseCache = new SemanticCache({
  vectorDB,
  similarityThreshold: 0.80
});

// Very strict (0.98+) - almost exact matches only
const veryStrictCache = new SemanticCache({
  vectorDB,
  similarityThreshold: 0.98
});
```

### With TTL (Time-To-Live)

```typescript
const cache = new SemanticCache({
  vectorDB,
  ttl: 86400  // 24 hours
});

// Cached responses expire after 24 hours
```

### Namespace for Multiple Models

```typescript
const gpt4Cache = new SemanticCache({
  vectorDB,
  namespace: 'gpt-4'
});

const claudeCache = new SemanticCache({
  vectorDB,
  namespace: 'claude-opus'
});

// Separate caches for different models
```

## Configuration

### Similarity Threshold

Controls how similar prompts need to be:

- `0.99` - Nearly identical prompts
- `0.95` - Very similar prompts (recommended for production)
- `0.90` - Similar prompts (good balance)
- `0.85` - Somewhat similar prompts
- `0.80` - Loosely similar prompts

### TTL (Time-To-Live)

How long to keep cached responses:

```typescript
{
  ttl: 3600      // 1 hour
  ttl: 86400     // 24 hours
  ttl: 604800    // 1 week
  ttl: 0         // Never expire
}
```

## Cost Savings Example

```typescript
// Without caching
// 1000 requests to GPT-4 @ $0.03 per 1K tokens
// Average 500 tokens per response
// Cost: 1000 * 0.03 * 0.5 = $15

// With semantic caching (75% hit rate)
// 250 requests to GPT-4
// 750 cache hits (free)
// Cost: 250 * 0.03 * 0.5 = $3.75
// Savings: $11.25 (75%)

const cache = new SemanticCache({ vectorDB });
// Just add caching, save 75%!
```

## Performance

Typical performance characteristics:

- **Cache Hit**: 10-50ms (vector lookup)
- **Cache Miss**: LLM latency + 20-100ms (store)
- **Memory**: Minimal (vectors stored in vector DB)

## Best Practices

### 1. Choose the Right Threshold

```typescript
// For FAQ / repetitive queries
{ similarityThreshold: 0.85 }

// For production assistants
{ similarityThreshold: 0.92 }

// For high-accuracy requirements
{ similarityThreshold: 0.97 }
```

### 2. Set Appropriate TTL

```typescript
// Real-time data (weather, news)
{ ttl: 300 }  // 5 minutes

// General knowledge
{ ttl: 86400 }  // 24 hours

// Static content
{ ttl: 604800 }  // 1 week
```

### 3. Monitor Hit Rates

```typescript
const stats = await cache.stats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

// Adjust threshold if hit rate is too low/high
```

### 4. Use Namespaces

```typescript
// Separate caches by use case
const customerSupport = new SemanticCache({
  vectorDB,
  namespace: 'customer-support'
});

const codeGen = new SemanticCache({
  vectorDB,
  namespace: 'code-generation'
});
```

## Dependencies

- [@neural-tools/core](../core) - Core utilities
- [@neural-tools/vector-db](../vector-db) - Vector database abstraction

## Contributing

Contributions are welcome! See the [main repository](https://github.com/MacLeanLuke/neural-tools) for guidelines.

## License

MIT - See [LICENSE.md](../../LICENSE.md) for details.

## Links

- [Documentation](https://neural-tools.com/docs/semantic-cache.html)
- [GitHub](https://github.com/MacLeanLuke/neural-tools)
- [npm](https://www.npmjs.com/package/@neural-tools/semantic-cache)
