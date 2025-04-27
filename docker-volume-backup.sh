#!/bin/bash

# Script for backing up and restoring Docker volumes
# Specifically designed for PostgreSQL data volumes in the LocalSpot application
# Usage: ./docker-volume-backup.sh [backup|restore] [volume_name] [backup_file]

set -e

VOLUME_NAME=${2:-localspot_postgres-data}
BACKUP_DIR="./volume_backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=${3:-"${BACKUP_DIR}/${VOLUME_NAME}_${DATE}.tar.gz"}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup a Docker volume
backup_volume() {
    echo "Backing up Docker volume: $VOLUME_NAME to $BACKUP_FILE"
    
    # Create a temporary container that mounts the volume and tar it up
    docker run --rm \
        -v $VOLUME_NAME:/source \
        -v $(pwd)/$BACKUP_DIR:/backup \
        alpine:latest \
        tar -czf /backup/$(basename $BACKUP_FILE) -C /source .
    
    echo "Backup completed: $BACKUP_FILE"
}

# Function to restore a Docker volume from backup
restore_volume() {
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Error: Backup file $BACKUP_FILE does not exist."
        exit 1
    fi
    
    echo "Restoring Docker volume: $VOLUME_NAME from $BACKUP_FILE"
    
    # Check if volume exists, create it if not
    if ! docker volume inspect $VOLUME_NAME > /dev/null 2>&1; then
        echo "Creating Docker volume: $VOLUME_NAME"
        docker volume create $VOLUME_NAME
    fi
    
    # Create a temporary container that mounts the volume and extract the tar file
    docker run --rm \
        -v $VOLUME_NAME:/destination \
        -v $(realpath $BACKUP_FILE):/backup.tar.gz \
        alpine:latest \
        sh -c "rm -rf /destination/* && tar -xzf /backup.tar.gz -C /destination"
    
    echo "Restore completed to volume: $VOLUME_NAME"
}

# Function to list all available backups
list_backups() {
    echo "Available backups:"
    ls -lh $BACKUP_DIR | grep .tar.gz
}

# Main script logic
case "$1" in
    backup)
        backup_volume
        ;;
    restore)
        if [ -z "$3" ]; then
            echo "Error: Backup file is required for restore operation."
            echo "Usage: $0 restore $VOLUME_NAME /path/to/backup.tar.gz"
            exit 1
        fi
        restore_volume
        ;;
    list)
        list_backups
        ;;
    *)
        echo "Usage: $0 [backup|restore|list] [volume_name] [backup_file]"
        echo "  backup  - Create backup of the specified Docker volume"
        echo "  restore - Restore a Docker volume from backup"
        echo "  list    - List all available backups"
        echo "Examples:"
        echo "  $0 backup localspot_postgres-data"
        echo "  $0 restore localspot_postgres-data ./volume_backups/localspot_postgres-data_20250427_120000.tar.gz"
        echo "  $0 list"
        exit 1
        ;;
esac

exit 0