import { FastMCP } from 'fastmcp';
import { createVectorStore, createEmbedding, chunkText } from '@neural-tools/vector-db';
import fs from 'fs/promises';
import path from 'path';

const mcp = new FastMCP({
  name: 'knowledge',
  version: '0.1.0',
  description: 'Semantic knowledge base with vector search'
});

// Initialize vector store
let vectorStore: Awaited<ReturnType<typeof createVectorStore>> | null = null;

async function getVectorStore() {
  if (!vectorStore) {
    vectorStore = await createVectorStore({
      provider: 'local', // Free tier uses local storage
      dimension: 384
    });
    await vectorStore.connect();
  }
  return vectorStore;
}

// Tool: Add Document to Knowledge Base
mcp.addTool({
  name: 'add_document',
  description: 'Add a document to the knowledge base with automatic chunking and embedding',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Document title'
      },
      content: {
        type: 'string',
        description: 'Document content'
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata (tags, category, etc.)',
        properties: {
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          source: { type: 'string' }
        }
      }
    },
    required: ['title', 'content']
  },
  execute: async (args: { title: string; content: string; metadata?: any }) => {
    const store = await getVectorStore();

    // Chunk the document
    const chunks = chunkText(args.content, { chunkSize: 500, overlap: 50 });

    // Create embeddings and store
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);
      vectors.push({
        id: `${args.title.replace(/\s+/g, '-').toLowerCase()}-chunk-${i}`,
        values: embedding,
        metadata: {
          title: args.title,
          chunk: i,
          totalChunks: chunks.length,
          content: chunks[i],
          ...args.metadata
        }
      });
    }

    await store.upsert(vectors);

    return {
      content: [
        {
          type: 'text',
          text: `✓ Document "${args.title}" added to knowledge base\n\n` +
                `- Created ${chunks.length} chunks\n` +
                `- Embedded and indexed for semantic search`
        }
      ]
    };
  }
});

// Tool: Search Knowledge Base
mcp.addTool({
  name: 'search',
  description: 'Search the knowledge base using semantic similarity',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      topK: {
        type: 'number',
        description: 'Number of results to return (default: 5)'
      },
      category: {
        type: 'string',
        description: 'Filter by category (optional)'
      }
    },
    required: ['query']
  },
  execute: async (args: { query: string; topK?: number; category?: string }) => {
    const store = await getVectorStore();

    // Create embedding for query
    const queryEmbedding = await createEmbedding(args.query);

    // Search
    const results = await store.query(queryEmbedding, {
      topK: args.topK || 5,
      filter: args.category ? { category: args.category } : undefined,
      includeMetadata: true
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No results found. Try adding documents first or using different search terms.'
          }
        ]
      };
    }

    const formatted = results.map((r, i) => {
      const meta = r.metadata as any;
      return `${i + 1}. ${meta.title} (chunk ${meta.chunk + 1}/${meta.totalChunks}) - Similarity: ${(r.score * 100).toFixed(1)}%\n\n${meta.content}\n\n` +
             (meta.category ? `Category: ${meta.category}\n` : '') +
             (meta.tags ? `Tags: ${meta.tags.join(', ')}\n` : '');
    }).join('\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} relevant results:\n\n${formatted}`
        }
      ]
    };
  }
});

// Tool: List All Documents
mcp.addTool({
  name: 'list_documents',
  description: 'List all documents in the knowledge base',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    const store = await getVectorStore();

    // For local store, we can get all vectors
    const allVectors = (store as any).getAll ? (store as any).getAll() : [];

    if (allVectors.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Knowledge base is empty. Add documents using add_document.'
          }
        ]
      };
    }

    // Group by title
    const docs = new Map<string, any>();
    for (const vector of allVectors) {
      const meta = vector.metadata as any;
      if (!docs.has(meta.title)) {
        docs.set(meta.title, {
          title: meta.title,
          chunks: meta.totalChunks,
          category: meta.category,
          tags: meta.tags
        });
      }
    }

    const formatted = Array.from(docs.values()).map(doc =>
      `📄 ${doc.title}\n` +
      `   Chunks: ${doc.chunks}\n` +
      (doc.category ? `   Category: ${doc.category}\n` : '') +
      (doc.tags ? `   Tags: ${doc.tags.join(', ')}\n` : '')
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Knowledge Base Contents (${docs.size} documents):\n\n${formatted}`
        }
      ]
    };
  }
});

// Start the server
mcp.start({
  transportType: 'stdio'
});
