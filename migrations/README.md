# Database Migrations

This directory contains database migration files managed by Drizzle ORM.

## How Migrations Work

1. Drizzle Kit will generate SQL migration files based on your schema
2. The docker-entrypoint.sh script runs these migrations on startup

## Manual Migration Commands

To generate and apply migrations manually:

```bash
# Generate migration
npx drizzle-kit generate:pg

# Apply migrations
npm run db:push
```

For Docker environments, migrations are automatically handled by the entrypoint script.