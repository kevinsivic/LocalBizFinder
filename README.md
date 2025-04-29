# LocalSpot

A platform for discovering locally owned retailers and restaurants with interactive map, business listings, and admin capabilities.

## Features

- Interactive map for discovering local businesses
- Detailed business listings with categorization
- User authentication system
- Admin panel for managing businesses
- Search and filtering capabilities
- Add new local businesses to the platform
- Automatic CSV import for bulk business data

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Map**: Leaflet
- **Authentication**: Passport.js

## Running with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Docker Architecture

The application uses a multi-stage Docker build process that optimizes for both development and production:

- **Base stage**: Contains common dependencies for all environments
- **Development stage**: Includes full dev dependencies with hot-reloading and volume mounts
- **Build stage**: Compiles and bundles application for production
- **Production stage**: Minimal image with only production dependencies and built assets

### Development Environment

1. Clone the repository:

```bash
git clone <repository-url>
cd localspot
```

2. Build and start the Docker containers for development:

```bash
# Using docker-compose directly
docker-compose up -d

# OR using the setup script
chmod +x docker-setup.sh  # Make the script executable (first time only)
./docker-setup.sh dev
```

This will start both the application server and the PostgreSQL database with hot-reloading enabled. The development environment uses volume mounts to enable code changes without rebuilding the container.

3. Access the application:

Open your browser and go to http://localhost:5000

### Production Environment

For a production environment, use the production configuration:

1. Create a `.env` file with your production settings:

```bash
cp .env.example .env
```

2. Edit the `.env` file and set secure values for the environment variables:

```
NODE_ENV=production
SESSION_SECRET=a_very_secure_random_string
POSTGRES_PASSWORD=a_secure_database_password
```

3. Build and start the production containers:

```bash
# Using docker-compose directly
docker-compose -f docker-compose.production.yml up -d

# OR using the setup script
./docker-setup.sh prod
```

This will build an optimized production image with smaller size and better security.

### Deployment

There are two main deployment options: standard production and high-availability (HA) production.

#### Regular Production Deployment

For deploying to a production server:

1. Install Docker and Docker Compose on your server.

2. Copy the following files to your server:
   - `Dockerfile`
   - `docker-compose.production.yml`
   - `docker-entrypoint.sh`
   - `.env` (with your production settings)
   - Your application code

3. Run the production stack:

```bash
# Copy the setup script and make it executable
chmod +x docker-setup.sh

# Run the production stack
./docker-setup.sh prod

# Or manually with docker-compose
docker-compose -f docker-compose.production.yml up -d
```

4. Set up a reverse proxy (like Nginx) to forward requests to your application and handle SSL:

```nginx
server {
    listen 80;
    server_name yourdomainname.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Use a tool like Certbot to set up SSL for your domain.

#### High-Availability Production Deployment

For deploying a scalable, high-availability production environment:

1. Set up a Docker Swarm cluster:

```bash
# Initialize Docker Swarm on the manager node
docker swarm init --advertise-addr <MANAGER-IP>

# Join worker nodes to the swarm
docker swarm join --token <TOKEN> <MANAGER-IP>:2377
```

2. Create the required external network:

```bash
# Create Traefik public network
docker network create --driver=overlay --attachable traefik-public
```

3. Create an `.env` file with all required variables:

```
POSTGRES_PASSWORD=secure_password
SESSION_SECRET=secure_session_secret
DOMAIN=yourdomain.com
ACME_EMAIL=your@email.com
TRAEFIK_AUTH=admin:hashed_password
PROMETHEUS_AUTH=admin:hashed_password
GRAFANA_PASSWORD=secure_password
REGISTRY=registry.example.com
REPOSITORY=yourorg/localspot
TAG=latest
```

4. Deploy the high-availability stack:

```bash
docker-compose -f docker-compose.production-ha.yml up -d
```

This will deploy the full stack with:
- Multiple app instances with load balancing
- PostgreSQL database
- Redis for session storage
- Traefik reverse proxy with automatic SSL (no need for Nginx)
- Prometheus for monitoring
- Grafana for dashboards
- Node exporter and cAdvisor for system metrics
- Automated database backups

5. Access your deployment:
   - Application: https://yourdomain.com
   - Traefik Dashboard: https://traefik.yourdomain.com (protected by HTTP basic auth)
   - Prometheus Metrics: https://monitoring.yourdomain.com (protected by HTTP basic auth)
   - Grafana Dashboards: https://grafana.yourdomain.com (admin/password from your env file)

   SSL certificates are automatically handled by Traefik via Let's Encrypt.

6. For automatic deployment, a GitHub Actions workflow is already set up in `.github/workflows/docker-image.yml`. You'll need to:

   - Configure the following secrets in your GitHub repository:
     - `SSH_HOST`: Your server's hostname or IP address
     - `SSH_USERNAME`: SSH username for your server
     - `SSH_PRIVATE_KEY`: Private key for SSH authentication

   - Uncomment the deployment section in the workflow file and update the deployment path.

   The workflow will automatically build and test your application on each push to the main branch, and deploy it if all tests pass.

### Stopping the Application

```bash
docker-compose down
```

To remove all data including the database volume:

```bash
docker-compose down -v
```

### Using Docker in Development

When developing with Docker, you can take advantage of the live-reload capabilities:

1. The application container is set up with volumes that map your local directory to the container, allowing changes to be reflected immediately.

2. If you need to install new npm packages, you can do it in two ways:
   - Install locally and restart the container: `npm install <package> && docker-compose restart app`
   - Run npm install inside the container: `docker-compose exec app npm install <package>`

3. To run database migrations:
   ```bash
   docker-compose exec app npx drizzle-kit push:pg
   ```

4. To view logs:
   ```bash
   docker-compose logs -f app
   ```

5. To access the PostgreSQL database:
   ```bash
   docker-compose exec postgres psql -U postgres -d localspot
   ```

6. Running tests with Docker:
   ```bash
   # Using docker-compose directly
   docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
   
   # OR using the setup script
   ./docker-setup.sh test
   ```

7. Creating database backups:
   ```bash
   # Backup development database
   ./docker-setup.sh backup
   
   # Backup production database
   ./docker-setup.sh backup:prod
   ```
   Backups are stored in the `./backups` directory with timestamps.

8. Managing Docker volumes:
   ```bash
   # Backup volume data
   ./docker-setup.sh volume:backup       # Development volume
   ./docker-setup.sh volume:backup:prod  # Production volume
   
   # List available volume backups
   ./docker-setup.sh volume:list
   
   # Restore volume from backup
   ./docker-setup.sh volume:restore ./volume_backups/localspot_postgres-data_20250427_120000.tar.gz
   ./docker-setup.sh volume:restore:prod ./volume_backups/localspot_postgres-data_20250427_120000.tar.gz
   ```
   Volume backups are stored in the `./volume_backups` directory.

## Development

### Environment Variables

#### Core Variables

These variables are required for all deployment types:

- `NODE_ENV`: Set to 'development' or 'production'
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://username:password@host:port/database`)
- `SESSION_SECRET`: Secret for session management (use a strong random string)
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name

#### High-Availability Deployment Variables

Additional variables needed for the high-availability setup:

- `DOMAIN`: Your domain name (e.g., `example.com`)
- `ACME_EMAIL`: Email address for Let's Encrypt certificates
- `TRAEFIK_AUTH`: HTTP Basic Auth credentials for Traefik dashboard (generated with `htpasswd`)
- `PROMETHEUS_AUTH`: HTTP Basic Auth credentials for Prometheus (generated with `htpasswd`)
- `GRAFANA_PASSWORD`: Password for Grafana admin user
- `REGISTRY`: Docker registry URL (optional, for CI/CD)
- `REPOSITORY`: Docker repository name (optional, for CI/CD)
- `TAG`: Docker image tag (optional, for CI/CD)
- `REDIS_URL`: Redis connection string (automatically set by the compose file)

For local development, the core variables are set in the `docker-compose.yml` file.

### Database

The application uses PostgreSQL for data storage. When running with Docker, the database is automatically set up with the following credentials:

- Username: postgres
- Password: postgres
- Database: localspot
- Port: 5432

### Admin Access

To access the admin panel, you need to create a user with admin privileges. Register a new user through the application and then manually update their `isAdmin` flag in the database to `true`.

### CSV Import Functionality

The application includes an automatic CSV watcher that monitors a specific directory for CSV files containing business data. When CSV files are placed in this directory, they are automatically processed, and businesses are added to the database.

#### CSV File Format

CSV files must include the following headers with corresponding data:

```
name,description,category,address,phone,website,latitude,longitude,imageUrl
```

Example:
```
name,description,category,address,phone,website,latitude,longitude,imageUrl
Local Bookstore,Independent bookstore with a wide selection of books,retail,123 Market St,555-555-1234,https://localbookstore.example.com,43.04,-78.66,https://example.com/images/bookstore.jpg
Craft Brewery,Local brewery offering craft beers,bar,456 Brewery Ave,555-555-5678,https://craftbrewery.example.com,43.05,-78.67,https://example.com/images/brewery.jpg
```

#### Directory Structure

- Place CSV files in the `data/csv` directory.
- Processed files are moved to `data/csv/processed` with a timestamp.
- Files with errors are moved to `data/csv/error` with a timestamp.

#### Using with Docker

To use the CSV import feature with Docker, mount a volume to the `/app/data/csv` directory in your container. This allows you to place CSV files in a directory on your host machine for automatic processing.

In docker-compose.yml:
```yaml
volumes:
  - ./import:/app/data/csv
```

Then, place your CSV files in the `./import` directory on your host machine.

#### Processing Logic

The CSV watcher:
1. Monitors the `data/csv` directory for new CSV files.
2. Parses each file and validates the data format.
3. Checks for duplicate businesses (by name and address) to avoid duplicates.
4. Inserts valid businesses into the database.
5. Moves processed files to the `processed` directory.
6. Moves files with errors to the `error` directory.
7. Provides detailed logs during processing.

## License

[MIT License](LICENSE)