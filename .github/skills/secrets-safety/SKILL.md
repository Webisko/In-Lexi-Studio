---
name: secrets-safety
description: Enforce safe handling of credentials, tokens, and environment-sensitive data during agent work in this repository.
user-invocable: false
---

# Secrets Safety

Use this skill whenever tasks involve auth, SMTP, API keys, deploy configuration, or operational documents.

## Rules

- Never commit credentials, tokens, private keys, or `.env` content.
- Prefer placeholders or environment variables in code and docs.
- Avoid echoing sensitive values in terminal commands and logs.
- If sensitive files exist in workspace notes, treat them as read-only operational context and avoid reproducing raw secrets.

## Response behavior

- When a task requires secret values, request them indirectly via environment variable names.
- If a change may expose secrets, propose a safer alternative and proceed with redacted implementation.
