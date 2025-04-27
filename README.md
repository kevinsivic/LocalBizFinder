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

### Starting the Application

1. Clone the repository:

```bash
git clone <repository-url>
cd localspot
```

2. Build and start the Docker containers:

```bash
docker-compose up -d
```

This will start both the application server and the PostgreSQL database.

3. Access the application:

Open your browser and go to http://localhost:5000

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