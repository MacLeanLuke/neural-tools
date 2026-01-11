---
argument-hint: name
description: Save current conversation context to knowledge base
allowed-tools:
  - Read
  - Write
  - Bash
---

# Save Context to Knowledge Base

Save the current conversation context to your vector database for future reference.

**Context Name:** $1

Steps:
1. Extract key information from the current conversation
2. Create embeddings of the conversation content
3. Store in vector database with metadata:
   - Timestamp
   - Tags/categories
   - Conversation summary
   - Key decisions made
4. Confirm successful save with retrieval instructions

This allows you to recall this context later with `/search-kb`.
