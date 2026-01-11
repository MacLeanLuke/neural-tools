---
argument-hint: query
description: Search vector database for relevant knowledge
allowed-tools:
  - Read
  - Bash
---

# Search Knowledge Base

Perform a semantic search across your vector database to find relevant information.

**Query:** $1

Steps:
1. Use the vector database MCP to search for semantically similar content
2. Retrieve the top 5 most relevant results
3. Display the results with sources and relevance scores
4. Optionally suggest follow-up queries

Return results in a clear, organized format with context.
