#!/bin/bash
set -e

# Function to wait for database
wait_for_db() {
  local retries=30
  local wait_time=2
  
  echo "🔄 Waiting for PostgreSQL..."
  
  for i in $(seq 1 $retries); do
    if PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -c '\l' &> /dev/null; then
      echo "✅ PostgreSQL is available!"
      return 0
    fi
    
    echo "⏳ PostgreSQL is unavailable - attempt $i/$retries - waiting ${wait_time}s..."
    sleep $wait_time
  done
  
  echo "❌ Could not connect to PostgreSQL after $retries attempts. Exiting."
  exit 1
}

# Function to run database migrations
run_migrations() {
  echo "🔄 Running database migrations with Drizzle..."
  
  # First, execute our explicit SQL migrations
  echo "🔄 Executing SQL migrations..."
  if node migrations/apply-migrations.js; then
    echo "✅ SQL migrations completed successfully."
  else
    echo "❌ SQL migrations failed with node apply-migrations.js"
    if [ "$NODE_ENV" = "production" ]; then
      echo "⚠️ Production environment - trying direct SQL execution..."
      # Run the ratings table creation manually as a last resort
      if psql "$DATABASE_URL" -f migrations/0001_create_ratings_table.sql; then
        echo "✅ Direct SQL execution succeeded."
      else
        echo "❌ All SQL migration attempts failed in production."
        echo "⚠️ Last attempt: trying to create ratings table with basic SQL..."
        if psql "$DATABASE_URL" -c 'CREATE TABLE IF NOT EXISTS "ratings" ("id" SERIAL PRIMARY KEY, "businessId" INTEGER NOT NULL, "userId" INTEGER NOT NULL, "rating" INTEGER NOT NULL, "comment" TEXT, "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL);'; then
          echo "✅ Basic ratings table created."
        else
          echo "❌ All migration attempts failed. Exiting."
          exit 1
        fi
      fi
    fi
  fi
  
  # Generate migration files from schema for any remaining tables
  echo "🔄 Ensuring complete schema with Drizzle push..."
  if npx drizzle-kit push; then
    echo "✅ Additional schema changes applied successfully."
  else
    echo "⚠️ Schema push had issues, but we'll continue since SQL migrations ran."
    
    if [ "$NODE_ENV" != "production" ]; then
      echo "🔧 Attempting to initialize database manually in development..."
      # Use the custom initialization script in development
      node server/init-db.js
    fi
  fi
}

# Main script logic
echo "🚀 Starting LocalSpot in $NODE_ENV mode..."

# Skip database wait in test mode with --skip-db flag
if [[ "$1" == "--skip-db" ]]; then
  echo "⏩ Skipping database wait and migrations..."
  shift # Remove the --skip-db argument
else
  wait_for_db
  run_migrations
fi

# Print environment info
echo "💻 Node.js version: $(node --version)"
echo "📦 NPM version: $(npm --version)"
echo "🌐 Environment: $NODE_ENV"

# Start the application
echo "🚀 Starting application..."
exec "$@"