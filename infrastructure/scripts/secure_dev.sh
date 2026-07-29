#!/bin/bash
echo "🛡️  Initializing Secure Pascal Environment..."

# 1. Check if Vault is mounted
if mountpoint -q ~/pascal_encrypted; then
    echo "✅ Vault is already mounted."
else
    echo "🔒 Vault is locked. Please enter password:"
    gocryptfs ~/pascal_vault ~/pascal_encrypted
fi

# 2. Set strict permissions
chmod 700 ~/pascal_encrypted
chmod 700 ~/pascal_vault

# 3. Enter the vault
cd ~/pascal_encrypted
echo "🚀 Secure Workspace Ready. Happy (and safe) Coding!"
bash
