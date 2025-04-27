#!/bin/bash

# LocalSpot Docker management script
# This script provides a comprehensive set of commands for managing
# Docker containers and environments for the LocalSpot application

# Text color variables
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Helper function to display colorful messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for required files
if [ ! -f "Dockerfile" ]; then
    log_error "Dockerfile not found. Are you in the correct directory?"
    exit 1
fi

# Check Docker and Docker Compose versions
docker_version=$(docker --version | awk '{print $3}' | tr -d ',')
docker_compose_version=$(docker-compose --version | awk '{print $3}' | tr -d ',')
log_info "Using Docker ${docker_version} and Docker Compose ${docker_compose_version}"

# Function to check and create .env file from example if it doesn't exist
check_env_file() {
    if [ ! -f .env ]; then
        if [ ! -f .env.example ]; then
            log_error "Neither .env nor .env.example found. Create a .env file with required environment variables."
            exit 1
        fi
        
        log_warning "No .env file found. Creating from .env.example..."
        cp .env.example .env
        
        if [ "$1" == "prod" ]; then
            log_warning "Please edit .env file with secure production values before proceeding."
            log_warning "At minimum, set the following variables:"
            echo "  - SESSION_SECRET (random secure string)"
            echo "  - POSTGRES_PASSWORD (secure database password)"
            exit 1
        fi
    else
        if [ "$1" == "prod" ]; then
            log_info "Using existing .env file for production environment"
        fi
    fi
}

# Function to start development environment
start_dev() {
    log_info "Starting development environment..."
    
    # Check if the application is already running
    if docker-compose ps | grep -q "localspot_app"; then
        log_warning "Application is already running. Use 'restart' command to refresh it."
        log_info "Development environment is at http://localhost:5000"
        return
    fi
    
    # Force rebuild if requested
    if [ "$1" == "--build" ]; then
        docker-compose up -d --build
    else
        docker-compose up -d
    fi
    
    log_success "Development environment started at http://localhost:5000"
    log_info "Use './docker-setup.sh logs' to view logs"
}

# Function to start production environment
start_prod() {
    check_env_file "prod"
    
    log_info "Starting production environment..."
    
    # Check if the production application is already running
    if docker-compose -f docker-compose.production.yml ps | grep -q "localspot_app"; then
        log_warning "Production application is already running. Use 'restart:prod' command to refresh it."
        log_info "Production environment is at http://localhost:5000"
        return
    fi
    
    # Force rebuild if requested
    if [ "$1" == "--build" ]; then
        docker-compose -f docker-compose.production.yml up -d --build
    else
        docker-compose -f docker-compose.production.yml up -d
    fi
    
    log_success "Production environment started at http://localhost:5000"
    log_info "Use './docker-setup.sh logs:prod' to view logs"
}

# Function to stop environment
stop() {
    if [ "$1" == "prod" ]; then
        log_info "Stopping production containers..."
        docker-compose -f docker-compose.production.yml down
    else
        log_info "Stopping development containers..."
        docker-compose down
    fi
    log_success "Containers stopped"
}

# Function to restart environment
restart() {
    if [ "$1" == "prod" ]; then
        log_info "Restarting production containers..."
        docker-compose -f docker-compose.production.yml restart
    else
        log_info "Restarting development containers..."
        docker-compose restart
    fi
    log_success "Containers restarted"
}

# Function to show logs
logs() {
    if [ "$1" == "prod" ]; then
        log_info "Showing production logs..."
        docker-compose -f docker-compose.production.yml logs -f
    else
        log_info "Showing development logs..."
        docker-compose logs -f
    fi
}

# Function to run tests
run_tests() {
    log_info "Running tests with Docker..."
    
    # Check if tests are already running
    if docker-compose -f docker-compose.test.yml ps | grep -q "localspot_test"; then
        log_warning "Tests are already running. Stopping first..."
        docker-compose -f docker-compose.test.yml down
    fi
    
    # Run tests with color output
    docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
    test_exit_code=$?
    
    # Clean up test containers
    docker-compose -f docker-compose.test.yml down
    
    if [ $test_exit_code -eq 0 ]; then
        log_success "Tests completed successfully"
    else
        log_error "Tests failed with exit code $test_exit_code"
        exit $test_exit_code
    fi
}

# Function to show environment status
status() {
    log_info "LocalSpot Docker Environment Status"
    echo
    echo "Development Containers:"
    docker-compose ps
    echo
    echo "Production Containers:"
    docker-compose -f docker-compose.production.yml ps 2>/dev/null || echo "No production containers running"
    echo
    echo "Docker Resources:"
    echo "Images:"
    docker images | grep localspot
    echo
    echo "Volumes:"
    docker volume ls | grep localspot
    echo
    echo "Networks:"
    docker network ls | grep localspot
}

# Function to backup database
backup_db() {
    log_info "Creating database backup..."
    mkdir -p backups
    
    # Generate timestamp for backup file
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    if [ "$1" == "prod" ]; then
        backup_file="backups/localspot_prod_${timestamp}.sql"
        log_info "Backing up production database to ${backup_file}..."
        
        # Check if production database is running
        if ! docker-compose -f docker-compose.production.yml ps | grep -q postgres; then
            log_error "Production database container is not running. Cannot create backup."
            exit 1
        fi
        
        # Create backup
        docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres -d localspot > "$backup_file"
    else
        backup_file="backups/localspot_dev_${timestamp}.sql"
        log_info "Backing up development database to ${backup_file}..."
        
        # Check if development database is running
        if ! docker-compose ps | grep -q postgres; then
            log_error "Development database container is not running. Cannot create backup."
            exit 1
        fi
        
        # Create backup
        docker-compose exec postgres pg_dump -U postgres -d localspot > "$backup_file"
    fi
    
    # Check if backup was successful
    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        log_success "Backup created: ${backup_file} ($(du -h "$backup_file" | cut -f1))"
    else
        log_error "Backup failed or created empty file: ${backup_file}"
        rm -f "$backup_file"
        exit 1
    fi
}

# Function to backup Docker volume
backup_volume() {
    if [ "$1" == "prod" ]; then
        VOLUME_NAME=localspot_postgres-data
        log_info "Backing up production Docker volume: $VOLUME_NAME"
    else
        VOLUME_NAME=localspot_postgres-data
        log_info "Backing up development Docker volume: $VOLUME_NAME"
    fi
    
    ./docker-volume-backup.sh backup "$VOLUME_NAME"
}

# Function to restore Docker volume
restore_volume() {
    if [ -z "$2" ]; then
        log_error "Backup file is required for volume restore operation."
        echo "Usage: $0 volume:restore [dev|prod] /path/to/backup.tar.gz"
        exit 1
    fi
    
    if [ "$1" == "prod" ]; then
        VOLUME_NAME=localspot_postgres-data
        log_info "Restoring production Docker volume: $VOLUME_NAME"
    else
        VOLUME_NAME=localspot_postgres-data
        log_info "Restoring development Docker volume: $VOLUME_NAME"
    fi
    
    ./docker-volume-backup.sh restore "$VOLUME_NAME" "$2"
}

# Function to run a shell in a container
run_shell() {
    if [ "$1" == "prod" ]; then
        log_info "Starting shell in production container..."
        docker-compose -f docker-compose.production.yml exec app /bin/bash
    else
        log_info "Starting shell in development container..."
        docker-compose exec app /bin/bash
    fi
}

# Function to run a database shell
run_db_shell() {
    if [ "$1" == "prod" ]; then
        log_info "Starting PostgreSQL shell in production container..."
        docker-compose -f docker-compose.production.yml exec postgres psql -U postgres -d localspot
    else
        log_info "Starting PostgreSQL shell in development container..."
        docker-compose exec postgres psql -U postgres -d localspot
    fi
}

# Function to rebuild the application
rebuild() {
    if [ "$1" == "prod" ]; then
        log_info "Rebuilding production application..."
        docker-compose -f docker-compose.production.yml build --no-cache app
        log_success "Production application rebuilt. Use './docker-setup.sh restart:prod' to apply changes."
    else
        log_info "Rebuilding development application..."
        docker-compose build --no-cache app
        log_success "Development application rebuilt. Use './docker-setup.sh restart' to apply changes."
    fi
}

# Function to update npm packages
update_packages() {
    log_info "Updating npm packages inside Docker container..."
    docker-compose exec app npm update
    log_success "Packages updated. Changes will be reflected in your local node_modules through Docker volume mount."
}

# Help message
show_help() {
    echo -e "${BLUE}LocalSpot Docker Management Tool${NC}"
    echo "Usage: ./docker-setup.sh [command]"
    echo
    echo "Development commands:"
    echo "  dev              - Start development environment"
    echo "  dev --build      - Start development environment with rebuild"
    echo "  stop             - Stop development environment"
    echo "  restart          - Restart development containers"
    echo "  logs             - Show development logs"
    echo "  shell            - Open shell in development app container"
    echo "  db-shell         - Open PostgreSQL shell in development database"
    echo
    echo "Production commands:"
    echo "  prod             - Start production environment"
    echo "  prod --build     - Start production environment with rebuild"
    echo "  stop:prod        - Stop production environment" 
    echo "  restart:prod     - Restart production containers"
    echo "  logs:prod        - Show production logs"
    echo "  shell:prod       - Open shell in production app container"
    echo "  db-shell:prod    - Open PostgreSQL shell in production database"
    echo
    echo "Testing:"
    echo "  test             - Run tests in Docker environment"
    echo
    echo "Database operations:"
    echo "  backup           - Backup development database"
    echo "  backup:prod      - Backup production database"
    echo
    echo "Volume operations:"
    echo "  volume:backup    - Backup development volume"
    echo "  volume:backup:prod - Backup production volume"
    echo "  volume:restore FILE - Restore development volume from backup file"
    echo "  volume:restore:prod FILE - Restore production volume from backup file"
    echo "  volume:list      - List volume backups"
    echo "  volume:verify FILE - Verify integrity of a backup file"
    echo "  volume:clean     - Clean old volume backups"
    echo
    echo "Maintenance:"
    echo "  status           - Show status of all containers"
    echo "  rebuild          - Rebuild development containers"
    echo "  rebuild:prod     - Rebuild production containers"
    echo "  update           - Update npm packages"
    echo "  clean            - Remove all containers and volumes"
    echo "  help             - Show this help message"
}

# Clean everything
clean() {
    log_warning "This will remove all containers, images, and volumes related to LocalSpot."
    read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled."
        exit 0
    fi
    
    log_info "Removing all containers and volumes..."
    docker-compose down -v
    docker-compose -f docker-compose.production.yml down -v 2>/dev/null
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null
    
    # Remove all related Docker images
    docker images | grep localspot | awk '{print $3}' | xargs -r docker rmi -f
    
    log_success "Cleanup completed"
}

# Main script
case "$1" in
    dev)
        start_dev "$2"
        ;;
    prod)
        start_prod "$2"
        ;;
    stop)
        stop "dev"
        ;;
    stop:prod)
        stop "prod"
        ;;
    restart)
        restart "dev"
        ;;
    restart:prod)
        restart "prod"
        ;;
    logs)
        logs "dev"
        ;;
    logs:prod)
        logs "prod"
        ;;
    status)
        status
        ;;
    test)
        run_tests
        ;;
    shell)
        run_shell "dev"
        ;;
    shell:prod)
        run_shell "prod"
        ;;
    db-shell)
        run_db_shell "dev"
        ;;
    db-shell:prod)
        run_db_shell "prod"
        ;;
    rebuild)
        rebuild "dev"
        ;;
    rebuild:prod)
        rebuild "prod"
        ;;
    update)
        update_packages
        ;;
    backup)
        backup_db "dev"
        ;;
    backup:prod)
        backup_db "prod"
        ;;
    volume:backup)
        backup_volume "dev"
        ;;
    volume:backup:prod)
        backup_volume "prod"
        ;;
    volume:restore)
        restore_volume "dev" "$2"
        ;;
    volume:restore:prod)
        restore_volume "prod" "$2"
        ;;
    volume:list)
        ./docker-volume-backup.sh list
        ;;
    volume:verify)
        ./docker-volume-backup.sh verify localspot_postgres-data "$2"
        ;;
    volume:clean)
        ./docker-volume-backup.sh clean
        ;;
    clean)
        clean
        ;;
    help|*)
        show_help
        ;;
esac

exit 0