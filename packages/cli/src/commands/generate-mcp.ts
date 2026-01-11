import path from 'path';
import fs from 'fs-extra';
import { logger, requireFeature } from '@neural-tools/core';
import inquirer from 'inquirer';

interface GenerateMCPOptions {
  description?: string;
  output?: string;
  fastmcp?: boolean;
  cicd?: 'github' | 'harness' | 'none';
  deployment?: 'aws' | 'gcp' | 'none';
  dryRun?: boolean;
}

export async function generateMCP(name: string, options: GenerateMCPOptions): Promise<void> {
  logger.header(`Generating MCP: ${name}`);

  // Check license for cloud deployment
  if (options.deployment !== 'none') {
    await requireFeature('cloud-deployment', 'Cloud Deployment');
  }

  // Prompt for missing information
  let description = options.description;
  if (!description) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description of your MCP:',
        default: `${name} MCP server`
      }
    ]);
    description = answers.description;
  }

  const outputDir = path.resolve(options.output || './apps', name);

  if (options.dryRun) {
    logger.info('Dry run mode - no files will be created');
    logger.section('Configuration', [
      `Name: ${name}`,
      `Description: ${description}`,
      `Output: ${outputDir}`,
      `Template: ${options.fastmcp ? 'FastMCP' : 'Standard'}`,
      `CI/CD: ${options.cicd}`,
      `Deployment: ${options.deployment}`
    ]);
    return;
  }

  // Check if directory already exists
  if (await fs.pathExists(outputDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${outputDir} already exists. Overwrite?`,
        default: false
      }
    ]);

    if (!overwrite) {
      logger.warn('Cancelled');
      return;
    }

    await fs.remove(outputDir);
  }

  logger.startSpinner('Creating MCP structure...');

  try {
    // Create directory structure
    await fs.ensureDir(outputDir);

    // Create pyproject.toml
    const pyprojectContent = `[project]
name = "mcp-${name}"
version = "0.1.0"
description = "${description}"
requires-python = ">=3.10"
dependencies = [
    "fastmcp>=2.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.black]
line-length = 100

[tool.ruff]
line-length = 100
`;

    await fs.writeFile(path.join(outputDir, 'pyproject.toml'), pyprojectContent, 'utf-8');

    // Create main server.py with FastMCP
    const serverContent = `"""
${name} MCP Server

${description}
"""
from fastmcp import FastMCP

mcp = FastMCP("${name}")


@mcp.tool()
def add_numbers(a: int, b: int) -> int:
    """Add two numbers together"""
    return a + b


@mcp.tool()
async def process_message(message: str) -> str:
    """Process a message and return the result"""
    return f"Processed: {message}"


@mcp.resource("config://version")
def get_version() -> str:
    """Get the current version of the MCP server"""
    return "0.1.0"


@mcp.resource("example://data/{item_id}")
async def get_item(item_id: str) -> str:
    """Get an item by ID"""
    return f"Item data for: {item_id}"


@mcp.prompt()
def review_code(code: str) -> str:
    """Generate a code review prompt"""
    return f"""Please review this code:

\`\`\`python
{code}
\`\`\`

Provide feedback on:
1. Code quality
2. Potential bugs
3. Performance improvements
4. Best practices
"""


@mcp.prompt()
def brainstorm_topic(topic: str) -> str:
    """Generate a brainstorming prompt"""
    return f"Let's brainstorm ideas about: {topic}"


if __name__ == "__main__":
    mcp.run()
`;

    await fs.writeFile(path.join(outputDir, 'server.py'), serverContent, 'utf-8');

    // Create README
    const readmeContent = `# ${name} MCP Server

${description}

## Quick Start with Docker

\`\`\`bash
# Start the MCP server
docker-compose up

# In another terminal, test it
docker-compose exec mcp python server.py
\`\`\`

## Local Development

### Prerequisites

- Python 3.10+
- uv (recommended) or pip

### Installation

\`\`\`bash
# Using uv (recommended)
uv pip install -e .

# Or using pip
pip install -e .
\`\`\`

### Running the Server

\`\`\`bash
# Development mode with MCP Inspector
fastmcp dev server.py

# Direct execution
python server.py

# Install to Claude Desktop
fastmcp install server.py
\`\`\`

## Usage with Claude Code

Add to your Claude Code settings (\`~/.config/claude/config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "python",
      "args": ["/path/to/server.py"]
    }
  }
}
\`\`\`

Or use the Docker container:

\`\`\`json
{
  "mcpServers": {
    "${name}": {
      "command": "docker",
      "args": ["run", "-i", "mcp-${name}"]
    }
  }
}
\`\`\`

## Features

- **Tools**: Add numbers, process messages
- **Resources**: Get version, retrieve items by ID
- **Prompts**: Code review, brainstorming

## Project Structure

\`\`\`
.
├── server.py           # Main MCP server
├── pyproject.toml      # Python project configuration
├── Dockerfile          # Docker image definition
├── docker-compose.yml  # Local development setup
└── README.md          # This file
\`\`\`

## Development

### Running Tests

\`\`\`bash
pytest
\`\`\`

### Code Formatting

\`\`\`bash
black .
ruff check .
\`\`\`

## License

MIT
`;

    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent, 'utf-8');

    // Create Dockerfile
    const dockerfileContent = `FROM python:3.11-slim

WORKDIR /app

# Install uv for faster dependency installation
RUN pip install --no-cache-dir uv

# Copy project files
COPY pyproject.toml .
COPY server.py .

# Install dependencies
RUN uv pip install --system --no-cache .

# Run the MCP server
CMD ["python", "server.py"]
`;

    await fs.writeFile(path.join(outputDir, 'Dockerfile'), dockerfileContent, 'utf-8');

    // Create docker-compose.yml
    const dockerComposeContent = `version: '3.8'

services:
  mcp:
    build: .
    image: mcp-${name}
    container_name: ${name}-mcp
    stdin_open: true
    tty: true
    volumes:
      - .:/app
    environment:
      - PYTHONUNBUFFERED=1
`;

    await fs.writeFile(path.join(outputDir, 'docker-compose.yml'), dockerComposeContent, 'utf-8');

    // Create .dockerignore
    const dockerignoreContent = `__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info
dist
build
.pytest_cache
.ruff_cache
.venv
venv
.git
.github
README.md
`;

    await fs.writeFile(path.join(outputDir, '.dockerignore'), dockerignoreContent, 'utf-8');

    // Add CI/CD if requested
    if (options.cicd === 'github') {
      await fs.ensureDir(path.join(outputDir, '.github', 'workflows'));
      const workflowContent = `name: Deploy MCP

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv pip install --system -e ".[dev]"

      - name: Run tests
        run: pytest

      - name: Check code formatting
        run: |
          black --check .
          ruff check .

  docker:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t mcp-${name}:latest .

      - name: Test Docker image
        run: docker run --rm mcp-${name}:latest python -c "import fastmcp; print('OK')"

  deploy:
    needs: [build, docker]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      ${options.deployment === 'aws' ? `
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: mcp-${name}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          docker tag \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG \$ECR_REGISTRY/\$ECR_REPOSITORY:latest
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:latest
` : ''}${options.deployment === 'gcp' ? `
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: \${{ secrets.GCP_CREDENTIALS }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build and push Docker image
        run: |
          gcloud builds submit --tag gcr.io/\${{ secrets.GCP_PROJECT_ID }}/mcp-${name}:latest
` : ''}
`;

      await fs.writeFile(
        path.join(outputDir, '.github', 'workflows', 'deploy.yml'),
        workflowContent,
        'utf-8'
      );
    }

    logger.succeedSpinner('MCP created successfully!');

    logger.section('Next steps', [
      `1. cd ${outputDir}`,
      '2. docker-compose up  # Start with Docker',
      '',
      'Or for local development:',
      '2. uv pip install -e .',
      '3. python server.py',
      '',
      'Or use MCP Inspector:',
      '2. uv pip install -e .',
      '3. fastmcp dev server.py',
      '',
      'Add to Claude Code settings to use this MCP'
    ]);

    logger.success(`✨ MCP "${name}" ready to use!`);
  } catch (error: any) {
    logger.failSpinner('Failed to create MCP');
    throw error;
  }
}
