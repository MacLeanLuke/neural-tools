# Contributing to Neural Tools

Thank you for your interest in contributing to Neural Tools! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (Node.js version, OS, etc.)
- Any relevant code snippets or error messages

### Suggesting Features

We love feature suggestions! Please create an issue with:
- A clear description of the feature
- Why this feature would be useful
- Any implementation ideas you have

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** in your fork
3. **Add tests** if applicable
4. **Ensure the build passes**: `pnpm build`
5. **Update documentation** if needed
6. **Submit a pull request**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/neural-tools.git
cd neural-tools

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm dev
```

### Project Structure

```
neural-tools/
├── packages/          # All published packages
│   ├── cli/          # Main CLI tool
│   ├── core/         # Core utilities
│   ├── create-ai-toolkit/  # Project scaffolding
│   ├── vector-db/    # Vector database abstraction
│   ├── semantic-cache/  # LLM caching
│   └── fine-tune/    # Fine-tuning utilities
├── claude/           # Example Claude commands
└── website/          # Documentation website
```

### Coding Guidelines

- **TypeScript**: All code should be in TypeScript
- **Formatting**: We use Prettier (run `pnpm format`)
- **Linting**: Follow ESLint rules (run `pnpm lint`)
- **Commits**: Write clear, descriptive commit messages
- **Tests**: Add tests for new features (when applicable)

### Commit Message Format

```
type: brief description

Longer description if needed

- Bullet points for details
- Multiple changes
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat: add vector database support for Weaviate`
- `fix: resolve CLI crash on invalid input`
- `docs: update README with installation instructions`

### Package-Specific Development

Each package has its own README with specific development instructions:

- [@neural-tools/cli](packages/cli/README.md)
- [@neural-tools/core](packages/core/README.md)
- [@neural-tools/create](packages/create-ai-toolkit/README.md)
- [@neural-tools/vector-db](packages/vector-db/README.md)
- [@neural-tools/semantic-cache](packages/semantic-cache/README.md)
- [@neural-tools/fine-tune](packages/fine-tune/README.md)

### Building Individual Packages

```bash
# Build a specific package
cd packages/cli
pnpm build

# Watch mode for development
pnpm dev
```

### Publishing (Maintainers Only)

```bash
# Version packages
pnpm changeset

# Publish to npm
pnpm release
```

## Code of Conduct

Please be respectful and constructive in all interactions. We're here to build great tools together.

## Questions?

- Open an issue for general questions
- Check existing issues and pull requests
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Neural Tools! 🎉
