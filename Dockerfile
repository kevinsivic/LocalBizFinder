# Base stage for shared dependencies
FROM node:20-slim AS base

# Install common dependencies for all stages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Development stage - builds on the base image
FROM base AS development

# Install all dependencies including dev dependencies
RUN npm ci

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy application code (will be overridden by volume mounts in development)
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Set health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use the entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Default command for development
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build

# Install all dependencies for build
RUN npm ci

# Copy application code
COPY . .

# Build the application
# First ensure the client directory exists
RUN mkdir -p ./client/dist
# Build the frontend and backend
RUN npm run build

# Production runtime stage - minimal image with only what's needed
FROM base AS production

# Install production dependencies and drizzle-kit for migrations
RUN npm ci --production && npm install drizzle-kit

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/shared ./shared
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/server/init-db.js ./server/
COPY --from=build /app/migrations ./migrations

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Set health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use the entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application in production mode
CMD ["node", "dist/index.js"]