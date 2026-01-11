# github MCP Server

GitHub API integration - issues, PRs, projects

## Installation

```bash
npm install
npm run build
```

## Development

```bash
npm run dev
```

## Usage

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/dist/index.js"]
    }
  }
}
```

## Features

- Example tool: Process messages
- Example prompt: Generate discussions
- Example resource: Serve static content

## License

MIT
