# LocalSpot

A platform for discovering locally owned retailers and restaurants with interactive map, business listings, and admin capabilities.

## Features

- Interactive map for discovering local businesses
- Detailed business listings with categorization
- User authentication system
- Admin panel for managing businesses
- Search and filtering capabilities
- Add new local businesses to the platform

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

This will start both the application server and the PostgreSQL database with hot-reloading enabled.

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

For deploying to a production server:

1. Install Docker and Docker Compose on your server.

2. Copy the following files to your server:
   - `Dockerfile.production`
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

## Development

### Environment Variables

The following environment variables are required:

- `NODE_ENV`: Set to 'development' or 'production'
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management

For local development, these are set in the docker-compose.yml file.

### Database

The application uses PostgreSQL for data storage. When running with Docker, the database is automatically set up with the following credentials:

- Username: postgres
- Password: postgres
- Database: localspot
- Port: 5432

### Admin Access

To access the admin panel, you need to create a user with admin privileges. Register a new user through the application and then manually update their `isAdmin` flag in the database to `true`.

## License

[MIT License](LICENSE)