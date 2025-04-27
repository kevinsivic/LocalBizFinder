#!/bin/bash
set -e

# Wait for PostgreSQL to be available
echo "Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -c '\l'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing drizzle migrations"

# Run migrations
npx drizzle-kit push:pg

# Start the application
echo "Starting application..."
exec "$@"