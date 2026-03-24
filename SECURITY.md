# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email **heznpc@gmail.com** or use [GitHub Security Advisories](../../security/advisories/new).
3. Include steps to reproduce, impact assessment, and suggested fix if possible.

We will respond within 48 hours and work with you to resolve the issue.

## Security Features

This template includes automated security checks in CI:

- **Secret leak detection** — [gitleaks](https://github.com/gitleaks/gitleaks) scans every commit
- **Large file detection** — Prevents accidental commits of files over 5 MB
- **Dependency updates** — [Dependabot](https://docs.github.com/en/code-security/dependabot) monitors for vulnerable dependencies
- **CodeQL analysis** — Static security analysis on every push and weekly

## Best Practices

- Never commit `.env` files or secrets — they are gitignored by default
- Use GitHub Secrets for Cloudflare credentials
- Keep dependencies up to date by merging Dependabot PRs
