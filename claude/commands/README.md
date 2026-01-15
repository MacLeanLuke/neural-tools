# Claude Commands

This directory contains example Claude commands that can be used with Claude Code.

## Available Commands

### /search-kb
**Description:** Search vector database for relevant knowledge

Performs a semantic search across your vector database to find relevant information.

**Usage:** `/search-kb <query>`

**What it does:**
1. Uses the vector database MCP to search for semantically similar content
2. Retrieves the top 5 most relevant results
3. Displays results with sources and relevance scores
4. Suggests follow-up queries

**Required tools:** Read, Bash

---

### /save-context
**Description:** Save current conversation context to knowledge base

Saves the current conversation context to your vector database for future reference.

**Usage:** `/save-context <name>`

**What it does:**
1. Extracts key information from the current conversation
2. Creates embeddings of the conversation content
3. Stores in vector database with metadata (timestamp, tags, summary, key decisions)
4. Confirms successful save with retrieval instructions

**Required tools:** Read, Write, Bash

---

### /github-issue
**Description:** Create GitHub issue from current context

Creates a GitHub issue from the current conversation context.

**Usage:** `/github-issue <title>`

**What it does:**
1. Analyzes the current conversation for problem description, steps to reproduce, and relevant code
2. Formats as a clear, actionable GitHub issue
3. Creates the issue using `gh` CLI
4. Returns the issue URL

**Required tools:** Bash (gh CLI), Read

---

## Creating Your Own Commands

Use the Neural Tools CLI to generate new commands:

```bash
neural-tools generate command <name> \
  --description "Your command description" \
  --args arg1 arg2 \
  --tools "Read" "Bash" \
  --global
```

For more information, see the [main README](../../README.md).
