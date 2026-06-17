# Verification Tools

This directory contains tools for verifying the integrity of backup data.

## Available Tools

- `verify.sh` - Verifies the integrity of backup files using checksums

## Usage

### verify.sh
```bash
./verify.sh [backup_directory] [log_file]
```

Verifies all backups in the specified directory using available checksum files.
If no checksums are available, it will perform basic validation of backup structure.

## Verification Process

1. Locate checksum files in backup directories
2. Validate all files against checksums
3. Report verification status
4. Log results to specified log file

## Integration

These tools can be integrated into backup workflows to ensure data integrity.