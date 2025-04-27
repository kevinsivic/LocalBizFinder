#!/bin/bash

# Script for backing up and restoring Docker volumes
# Specifically designed for PostgreSQL data volumes in the LocalSpot application
# Usage: ./docker-volume-backup.sh [backup|restore|list|clean|verify] [volume_name] [backup_file]

set -e

# Default values
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VOLUME_NAME=${2:-localspot_postgres-data}
BACKUP_DIR="${SCRIPT_DIR}/volume_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=${3:-"${BACKUP_DIR}/${VOLUME_NAME}_${DATE}.tar.gz"}
RETENTION_DAYS=30
PRODUCTION_PREFIX="prod_"
MAX_BACKUPS=10

# Text color variables
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

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

# Helper function to check if a volume exists
volume_exists() {
    docker volume inspect "$1" &> /dev/null
}

# Function to backup a Docker volume
backup_volume() {
    # Check if volume exists
    if ! volume_exists "$VOLUME_NAME"; then
        log_error "Volume $VOLUME_NAME does not exist."
        exit 1
    fi

    local backup_basename=$(basename "$BACKUP_FILE")
    log_info "Backing up Docker volume: $VOLUME_NAME to $backup_basename"
    
    # Check if PostgreSQL container is running and trigger a pre-backup CHECKPOINT
    if [[ "$VOLUME_NAME" == *"postgres"* ]]; then
        log_info "PostgreSQL volume detected. Trying to perform CHECKPOINT..."
        if docker ps | grep -q postgres; then
            docker exec $(docker ps -q -f name=postgres) psql -U postgres -c "CHECKPOINT;" &> /dev/null || \
                log_warning "Could not execute CHECKPOINT command. Backup might not be consistent."
        else
            log_warning "PostgreSQL container not running. Skipping CHECKPOINT."
        fi
    fi
    
    # Create a temporary container that mounts the volume and tar it up
    docker run --rm \
        -v "$VOLUME_NAME:/source" \
        -v "${BACKUP_DIR}:/backup" \
        alpine:latest \
        tar -czf "/backup/$(basename "$BACKUP_FILE")" -C /source .
    
    # Verify backup file was created
    if [ -f "$BACKUP_FILE" ]; then
        log_success "Backup completed: $(basename "$BACKUP_FILE") ($(du -h "$BACKUP_FILE" | cut -f1))"
        
        # Clean old backups
        clean_old_backups
    else
        log_error "Backup failed: $BACKUP_FILE not created"
        exit 1
    fi
}

# Function to restore a Docker volume from backup
restore_volume() {
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file $BACKUP_FILE does not exist."
        exit 1
    fi
    
    log_info "Restoring Docker volume: $VOLUME_NAME from $(basename "$BACKUP_FILE")"
    
    # Check if PostgreSQL containers are running and stop them
    if [[ "$VOLUME_NAME" == *"postgres"* ]]; then
        log_info "PostgreSQL volume detected. Checking for running PostgreSQL containers..."
        local pg_containers=$(docker ps -q -f name=postgres)
        if [ -n "$pg_containers" ]; then
            log_warning "Found running PostgreSQL containers. These will be stopped before restore."
            read -p "Continue with restore? (y/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Restore cancelled."
                exit 0
            fi
            
            for container in $pg_containers; do
                log_info "Stopping container: $(docker container inspect -f '{{.Name}}' $container | sed 's/\///')"
                docker stop $container
            done
        fi
    fi
    
    # Check if volume exists, create it if not
    if ! volume_exists "$VOLUME_NAME"; then
        log_info "Creating Docker volume: $VOLUME_NAME"
        docker volume create "$VOLUME_NAME"
    else
        # Create backup of existing volume before restore
        local temp_backup="${BACKUP_DIR}/${VOLUME_NAME}_pre_restore_${DATE}.tar.gz"
        log_warning "Volume $VOLUME_NAME already exists. Creating backup before restore: $(basename "$temp_backup")"
        
        docker run --rm \
            -v "$VOLUME_NAME:/source" \
            -v "${BACKUP_DIR}:/backup" \
            alpine:latest \
            tar -czf "/backup/$(basename "$temp_backup")" -C /source .
        
        log_success "Pre-restore backup created: $(basename "$temp_backup")"
    fi
    
    # Create a temporary container that mounts the volume and extract the tar file
    docker run --rm \
        -v "$VOLUME_NAME:/destination" \
        -v "$(realpath "$BACKUP_FILE"):/backup.tar.gz" \
        alpine:latest \
        sh -c "rm -rf /destination/* && tar -xzf /backup.tar.gz -C /destination"
    
    log_success "Restore completed to volume: $VOLUME_NAME"
    
    # Restart PostgreSQL containers if they were stopped
    if [[ "$VOLUME_NAME" == *"postgres"* && -n "${pg_containers:-}" ]]; then
        log_info "Restarting PostgreSQL containers..."
        for container in $pg_containers; do
            container_name=$(docker container inspect -f '{{.Name}}' $container | sed 's/\///')
            log_info "Starting container: $container_name"
            docker start $container
        done
    fi
}

# Function to verify a backup file
verify_backup() {
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file $BACKUP_FILE does not exist."
        exit 1
    fi
    
    log_info "Verifying backup file: $(basename "$BACKUP_FILE")"
    
    # Check if the tar file is valid
    if ! tar -tzf "$BACKUP_FILE" &> /dev/null; then
        log_error "Backup file is corrupted or not a valid tar.gz archive."
        exit 1
    fi
    
    # Create a temporary directory for extraction test
    local temp_dir=$(mktemp -d)
    log_info "Extracting a sample of files to temporary directory for verification..."
    
    # Extract a few files from the tar to verify content
    tar -tzf "$BACKUP_FILE" | head -5 | xargs -I{} tar -xzf "$BACKUP_FILE" -C "$temp_dir" {} 2>/dev/null || true
    
    # Count extracted files
    local file_count=$(find "$temp_dir" -type f | wc -l)
    
    # Clean up
    rm -rf "$temp_dir"
    
    if [ "$file_count" -gt 0 ]; then
        log_success "Backup verification passed. Backup contains valid files."
    else
        log_warning "Backup verification found no files. The backup may be empty or contain only directories."
    fi
    
    # Show backup details
    local size=$(du -h "$BACKUP_FILE" | cut -f1)
    local created=$(stat -c '%y' "$BACKUP_FILE" | cut -d. -f1)
    local file_count=$(tar -tzf "$BACKUP_FILE" | wc -l)
    
    echo "Backup details:"
    echo "  File: $(basename "$BACKUP_FILE")"
    echo "  Size: $size"
    echo "  Created: $created"
    echo "  Contains: $file_count files/directories"
}

# Function to list all available backups
list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    
    if [ ! "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        log_warning "No backups found."
        return
    fi
    
    # List backups with size and creation date
    echo "--------------------------------------------------------------------------------------------------------"
    echo "| Size    | Creation Date         | Backup File                                                        |"
    echo "--------------------------------------------------------------------------------------------------------"
    
    for backup in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$backup" ]; then
            local size=$(du -h "$backup" | cut -f1)
            local date=$(stat -c '%y' "$backup" | cut -d. -f1)
            local basename=$(basename "$backup")
            
            # Determine if it's a production backup
            local env_type=""
            if [[ "$basename" == *"$PRODUCTION_PREFIX"* ]]; then
                env_type="[PROD]"
            fi
            
            printf "| %-7s | %-21s | %-65s %s\n" "$size" "$date" "$basename" "$env_type"
        fi
    done
    echo "--------------------------------------------------------------------------------------------------------"
    
    # Show total size of backups
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    echo "Total backup size: $total_size"
}

# Function to clean old backups
clean_old_backups() {
    log_info "Cleaning old backups (keeping last $MAX_BACKUPS backups and those newer than $RETENTION_DAYS days)..."
    
    # Delete backups older than RETENTION_DAYS days
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -exec bash -c 'echo "Removing old backup: $(basename {})"' \; -exec rm {} \;
    
    # Keep only MAX_BACKUPS most recent backups for each volume
    for volume in $(find "$BACKUP_DIR" -name "*.tar.gz" | sed 's/.*\///g' | sed 's/_[0-9]\{8\}_[0-9]\{6\}\.tar\.gz$//g' | sort | uniq); do
        local count=$(find "$BACKUP_DIR" -name "${volume}_*.tar.gz" | wc -l)
        if [ "$count" -gt "$MAX_BACKUPS" ]; then
            log_info "Volume $volume has $count backups, keeping newest $MAX_BACKUPS"
            find "$BACKUP_DIR" -name "${volume}_*.tar.gz" | sort | head -n $(($count - $MAX_BACKUPS)) | xargs -I{} bash -c 'echo "Removing excess backup: $(basename {})"' \; -exec rm {} \;
        fi
    done
    
    log_success "Backup cleanup completed."
}

# Main script logic
case "$1" in
    backup)
        backup_volume
        ;;
    restore)
        if [ -z "$3" ]; then
            log_error "Backup file is required for restore operation."
            echo "Usage: $0 restore $VOLUME_NAME /path/to/backup.tar.gz"
            exit 1
        fi
        restore_volume
        ;;
    list)
        list_backups
        ;;
    verify)
        if [ -z "$3" ]; then
            log_error "Backup file is required for verify operation."
            echo "Usage: $0 verify [volume_name] /path/to/backup.tar.gz"
            exit 1
        fi
        verify_backup
        ;;
    clean)
        clean_old_backups
        ;;
    *)
        echo -e "${BLUE}LocalSpot Docker Volume Backup Utility${NC}"
        echo "Usage: $0 [command] [volume_name] [backup_file]"
        echo
        echo "Commands:"
        echo "  backup  - Create backup of a Docker volume"
        echo "  restore - Restore a Docker volume from backup"
        echo "  list    - List all available backups"
        echo "  verify  - Verify the integrity of a backup file"
        echo "  clean   - Clean old backups (keep last $MAX_BACKUPS backups and those newer than $RETENTION_DAYS days)"
        echo
        echo "Examples:"
        echo "  $0 backup localspot_postgres-data"
        echo "  $0 restore localspot_postgres-data ./volume_backups/localspot_postgres-data_20250427_120000.tar.gz"
        echo "  $0 verify localspot_postgres-data ./volume_backups/localspot_postgres-data_20250427_120000.tar.gz"
        echo "  $0 list"
        echo "  $0 clean"
        echo
        echo "Default volume name: localspot_postgres-data"
        exit 1
        ;;
esac

exit 0