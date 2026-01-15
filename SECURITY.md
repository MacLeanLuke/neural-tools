# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please do **NOT** open a public issue.

Instead, please report it by:

1. **Email**: Send details to the repository owner (check GitHub profile)
2. **GitHub Security Advisories**: Use the "Security" tab on GitHub to privately report vulnerabilities

### What to Include

Please include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)

### Response Timeline

- We will acknowledge receipt within **48 hours**
- We will provide a detailed response within **7 days**
- We will work on a fix and notify you when it's released

### Disclosure Policy

- Please give us reasonable time to fix the vulnerability before public disclosure
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using Neural Tools:

### API Keys and Credentials

- **Never commit** API keys, tokens, or credentials to version control
- Use environment variables for sensitive data
- Add `.env` files to `.gitignore` (already configured)

### Dependencies

- Keep dependencies up to date
- Run `pnpm audit` regularly
- Review dependency security advisories

### Generated Code

- Review generated MCP servers and commands before deployment
- Validate user inputs in generated applications
- Follow security best practices for your deployment platform

### Vector Databases

- Use authentication for production vector database connections
- Encrypt sensitive data before storing in vector databases
- Follow provider-specific security guidelines

## Known Security Considerations

### CLI Tools

- The CLI generates code based on user input
- Always review generated code before running in production
- Be cautious when using `--deployment` flags with cloud credentials

### Docker

- Generated Dockerfiles use official base images
- Review and customize Dockerfiles for your security requirements
- Keep Docker images updated

### GitHub Actions

- Workflows use GitHub secrets for sensitive data
- Review workflow permissions before enabling
- Use read-only tokens when possible

## Questions?

For non-security questions, please open a regular GitHub issue.

For security concerns, follow the reporting process above.

---

Thank you for helping keep Neural Tools secure! 🔒
