---
argument-hint: title
description: Create GitHub issue from current context
allowed-tools:
  - Bash(gh *)
  - Read
---

# Create GitHub Issue

Create a GitHub issue from the current conversation context.

**Issue Title:** $1

Steps:
1. Analyze the current conversation for:
   - Problem description
   - Steps to reproduce (if applicable)
   - Expected vs actual behavior
   - Relevant code snippets or file paths
2. Format as a clear, actionable GitHub issue
3. Create the issue using `gh` CLI:
   ```
   gh issue create --title "$1" --body "<formatted content>"
   ```
4. Return the issue URL

The issue will include:
- Clear problem statement
- Context from our conversation
- Relevant code references
- Suggested next steps
