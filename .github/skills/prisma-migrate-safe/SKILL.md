---
name: prisma-migrate-safe
description: Safely modify Prisma schema and migrations for the SQLite CMS database with minimal risk and clear validation steps.
---

# Prisma Migrate Safe

Use this skill when changing data models, migrations, seeds, or database-related API behavior.

## Procedure

1. Apply schema change in `prisma/schema.prisma` with backward compatibility in mind.
2. Run `npx prisma generate` after schema edits.
3. If migration is required by scope, create it with `npx prisma migrate dev --name <migration_name>`.
4. Check affected backend read/write paths in `api/routes.js`.
5. Confirm app boot with `node app.js` after DB-related changes.

## Guardrails

- Do not modify historical migration SQL unless explicitly requested.
- Do not delete data columns/tables without explicit approval.
- Keep migration names descriptive and task-scoped.
