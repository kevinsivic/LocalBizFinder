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
  
  # Generate migration directory if it doesn't exist
  mkdir -p ./migrations
  
  # Generate migration files from schema
  echo "🔄 Generating migration files..."
  npx drizzle-kit generate:pg
  
  # Push schema changes to database (this is critical for the ratings table)
  echo "🔄 Applying schema changes to database..."
  if npx drizzle-kit push:pg; then
    echo "✅ Database migrations completed successfully."
  else
    echo "❌ Database migration failed with drizzle-kit push:pg."
    echo "🔄 Trying alternative push method..."
    
    # Try npm script which might have better configuration
    if npm run db:push; then
      echo "✅ Database migrations completed successfully with npm run db:push."
    else
      echo "❌ Database migration failed with npm run db:push."
      
      if [ "$NODE_ENV" = "production" ]; then
        echo "⚠️ Production environment - attempting direct schema push one more time..."
        # Try one more approach in production before failing
        if NODE_ENV=production npx drizzle-kit push --verbose; then
          echo "✅ Database migrations finally succeeded."
          return 0
        else
          echo "❌ All migration attempts failed in production. Exiting."
          exit 1
        fi
      else
        echo "⚠️ Development environment - continuing despite migration errors."
        echo "🔧 Attempting to initialize database manually..."
        # Use the custom initialization script
        node server/init-db.js
      fi
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