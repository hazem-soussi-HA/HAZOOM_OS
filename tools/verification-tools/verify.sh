#!/bin/bash

# Verification Tool
# This script verifies the integrity of backup files

set -e

# Default configuration
BACKUP_DIR="${1:-./backups}"
LOG_FILE="${2:-./logs/verification.log}"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

log_message "Starting verification process for backup directory: $BACKUP_DIR"

# Check if backup directory exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    log_message "ERROR: Backup directory does not exist: $BACKUP_DIR"
    exit 1
fi

# Find all checksum files
checksum_files=$(find "$BACKUP_DIR" -name "checksums.md5" -type f)

if [[ -z "$checksum_files" ]]; then
    log_message "No checksum files found in $BACKUP_DIR"
    log_message "Looking for any backup subdirectories to verify..."
    
    # Look for backup subdirectories
    for subdir in "$BACKUP_DIR"/*/; do
        if [[ -d "$subdir" ]]; then
            backup_name=$(basename "$subdir")
            log_message "Checking backup: $backup_name"
            
            # Count files in backup
            file_count=$(find "$subdir" -type f | wc -l)
            log_message "Found $file_count files in $backup_name"
            
            # Check if there's a metadata file
            if [[ -f "$subdir/metadata.json" ]]; then
                log_message "Metadata file found for $backup_name"
                size_in_meta=$(grep -o '"backup_size":[0-9]*' "$subdir/metadata.json" | cut -d: -f2)
                log_message "Size from metadata: $size_in_meta bytes"
            fi
        fi
    done
else
    log_message "Found checksum files, verifying integrity..."
    
    # Verify each checksum file
    while IFS= read -r checksum_file; do
        log_message "Verifying checksums in: $checksum_file"
        backup_dir=$(dirname "$checksum_file")
        
        cd "$backup_dir"
        if md5sum -c checksums.md5 >/dev/null 2>&1; then
            log_message "Verification PASSED for: $backup_dir"
        else
            log_message "Verification FAILED for: $backup_dir"
            # Don't exit on failure, continue checking other backups
        fi
        cd - >/dev/null
    done <<< "$checksum_files"
fi

log_message "Verification process completed"