import { FastMCP } from 'fastmcp';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const mcp = new FastMCP({
  name: 'github',
  version: '0.1.0',
  description: 'GitHub API integration - issues, PRs, projects'
});

// Helper to execute gh CLI commands
async function ghCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`gh ${command}`);
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`GitHub CLI error: ${error.message}`);
  }
}

// Tool: Create GitHub Issue
mcp.addTool({
  name: 'create_issue',
  description: 'Create a new GitHub issue in the current repository',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Issue title'
      },
      body: {
        type: 'string',
        description: 'Issue description'
      },
      labels: {
        type: 'string',
        description: 'Comma-separated labels (optional)'
      },
      assignee: {
        type: 'string',
        description: 'Assignee username (optional)'
      }
    },
    required: ['title', 'body']
  },
  execute: async (args: { title: string; body: string; labels?: string; assignee?: string }) => {
    let command = `issue create --title "${args.title}" --body "${args.body}"`;

    if (args.labels) {
      command += ` --label "${args.labels}"`;
    }

    if (args.assignee) {
      command += ` --assignee "${args.assignee}"`;
    }

    const output = await ghCommand(command);

    return {
      content: [
        {
          type: 'text',
          text: `✓ Issue created successfully!\n\n${output}`
        }
      ]
    };
  }
});

// Tool: Search Code
mcp.addTool({
  name: 'search_code',
  description: 'Search for code across GitHub repositories',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      language: {
        type: 'string',
        description: 'Filter by programming language (optional)'
      },
      limit: {
        type: 'number',
        description: 'Number of results to return (default: 10)'
      }
    },
    required: ['query']
  },
  execute: async (args: { query: string; language?: string; limit?: number }) => {
    let command = `search code "${args.query}" --json repository,path,url --limit ${args.limit || 10}`;

    if (args.language) {
      command = `search code "${args.query} language:${args.language}" --json repository,path,url --limit ${args.limit || 10}`;
    }

    const output = await ghCommand(command);
    const results = JSON.parse(output);

    const formatted = results.map((r: any) =>
      `📁 ${r.repository.fullName}/${r.path}\n   ${r.url}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} results:\n\n${formatted}`
        }
      ]
    };
  }
});

// Tool: List Pull Requests
mcp.addTool({
  name: 'list_prs',
  description: 'List pull requests in the current repository',
  parameters: {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        description: 'Filter by state: open, closed, merged, all',
        enum: ['open', 'closed', 'merged', 'all']
      },
      limit: {
        type: 'number',
        description: 'Number of PRs to return (default: 10)'
      }
    },
    required: []
  },
  execute: async (args: { state?: string; limit?: number }) => {
    const state = args.state || 'open';
    const limit = args.limit || 10;

    const output = await ghCommand(`pr list --state ${state} --json number,title,author,url --limit ${limit}`);
    const prs = JSON.parse(output);

    const formatted = prs.map((pr: any) =>
      `#${pr.number} ${pr.title}\n   by @${pr.author.login}\n   ${pr.url}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Pull Requests (${state}):\n\n${formatted || 'No pull requests found.'}`
        }
      ]
    };
  }
});

// Tool: Get Repository Info
mcp.addTool({
  name: 'repo_info',
  description: 'Get information about a GitHub repository',
  parameters: {
    type: 'object',
    properties: {
      repo: {
        type: 'string',
        description: 'Repository in owner/name format (optional, uses current repo if not specified)'
      }
    },
    required: []
  },
  execute: async (args: { repo?: string }) => {
    const command = args.repo
      ? `repo view ${args.repo} --json name,description,stargazerCount,forkCount,url,isPrivate,primaryLanguage`
      : `repo view --json name,description,stargazerCount,forkCount,url,isPrivate,primaryLanguage`;

    const output = await ghCommand(command);
    const repo = JSON.parse(output);

    const info = `
📦 ${repo.name}
${repo.description || 'No description'}

⭐ Stars: ${repo.stargazerCount}
🍴 Forks: ${repo.forkCount}
🔒 Private: ${repo.isPrivate ? 'Yes' : 'No'}
💻 Language: ${repo.primaryLanguage?.name || 'Unknown'}

🔗 ${repo.url}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: info
        }
      ]
    };
  }
});

// Tool: Search Issues
mcp.addTool({
  name: 'search_issues',
  description: 'Search for issues and pull requests',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      state: {
        type: 'string',
        description: 'Filter by state: open or closed',
        enum: ['open', 'closed']
      },
      limit: {
        type: 'number',
        description: 'Number of results (default: 10)'
      }
    },
    required: ['query']
  },
  execute: async (args: { query: string; state?: string; limit?: number }) => {
    let query = args.query;
    if (args.state) {
      query += ` state:${args.state}`;
    }

    const output = await ghCommand(`search issues "${query}" --json number,title,url,state --limit ${args.limit || 10}`);
    const issues = JSON.parse(output);

    const formatted = issues.map((issue: any) =>
      `#${issue.number} [${issue.state}] ${issue.title}\n   ${issue.url}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${issues.length} results:\n\n${formatted || 'No issues found.'}`
        }
      ]
    };
  }
});

// Prompt: Create Issue from Context
mcp.addPrompt({
  name: 'issue_from_context',
  description: 'Create a GitHub issue based on conversation context',
  arguments: [
    {
      name: 'context',
      description: 'Context or description for the issue',
      required: true
    }
  ],
  execute: async (args: { context: string }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a well-formatted GitHub issue based on this context:\n\n${args.context}\n\nPlease format it with:\n- Clear, actionable title\n- Detailed description\n- Steps to reproduce (if applicable)\n- Expected vs actual behavior\n- Suggested labels`
          }
        }
      ]
    };
  }
});

// Resource: Current Repository
mcp.addResource({
  uri: 'github://current-repo',
  name: 'Current Repository',
  description: 'Information about the current GitHub repository',
  mimeType: 'application/json',
  text: async () => {
    try {
      const output = await ghCommand('repo view --json name,owner,description,url,defaultBranchRef');
      return output;
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  }
});

// Start the server
mcp.start({
  transportType: 'stdio'
});
