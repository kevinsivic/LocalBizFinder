#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to start development environment
start_dev() {
    echo "Starting development environment..."
    docker-compose up -d
    echo "Development environment started at http://localhost:5000"
}

# Function to start production environment
start_prod() {
    if [ ! -f .env ]; then
        echo "Creating .env file from example..."
        cp .env.example .env
        echo "Please edit .env file with your production settings"
        exit 1
    fi
    
    echo "Starting production environment..."
    docker-compose -f docker-compose.production.yml up -d
    echo "Production environment started at http://localhost:5000"
}

# Function to stop environment
stop() {
    echo "Stopping containers..."
    if [ "$1" == "prod" ]; then
        docker-compose -f docker-compose.production.yml down
    else
        docker-compose down
    fi
    echo "Containers stopped"
}

# Function to show logs
logs() {
    if [ "$1" == "prod" ]; then
        docker-compose -f docker-compose.production.yml logs -f
    else
        docker-compose logs -f
    fi
}

# Function to run tests
run_tests() {
    echo "Running tests with Docker..."
    docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
    docker-compose -f docker-compose.test.yml down
    echo "Tests completed"
}

# Function to backup database
backup_db() {
    echo "Creating database backup..."
    mkdir -p backups
    
    if [ "$1" == "prod" ]; then
        docker-compose -f docker-compose.production.yml -f docker-compose.backup.yml run --rm backup
    else
        docker-compose -f docker-compose.backup.yml run --rm backup
    fi
    
    echo "Backup created in ./backups directory"
}

# Help message
show_help() {
    echo "Usage: ./docker-setup.sh [command]"
    echo "Commands:"
    echo "  dev        - Start development environment"
    echo "  prod       - Start production environment"
    echo "  stop       - Stop development environment"
    echo "  stop:prod  - Stop production environment" 
    echo "  logs       - Show development logs"
    echo "  logs:prod  - Show production logs"
    echo "  test       - Run tests in Docker environment"
    echo "  backup     - Backup development database"
    echo "  backup:prod - Backup production database"
    echo "  clean      - Remove all containers and volumes"
    echo "  help       - Show this help message"
}

# Clean everything
clean() {
    echo "Removing all containers and volumes..."
    docker-compose down -v
    docker-compose -f docker-compose.production.yml down -v 2>/dev/null
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null
    echo "Cleanup completed"
}

# Main script
case "$1" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop "dev"
        ;;
    stop:prod)
        stop "prod"
        ;;
    logs)
        logs "dev"
        ;;
    logs:prod)
        logs "prod"
        ;;
    test)
        run_tests
        ;;
    backup)
        backup_db "dev"
        ;;
    backup:prod)
        backup_db "prod"
        ;;
    clean)
        clean
        ;;
    help|*)
        show_help
        ;;
esac