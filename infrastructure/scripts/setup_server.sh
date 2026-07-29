#!/bin/bash

echo "🚀 Starting Ubuntu Server Automation..."

# 1. Update & Upgrade System
sudo apt update && sudo apt upgrade -y

# 2. Install Essential Server Tools
echo "📦 Installing essential tools (Git, Curl, Vim, HTOP, etc.)..."
sudo apt install -y build-essential software-properties-common \
    curl wget git vim htop zip unzip net-tools iputils-ping

# 3. Install Docker (Most important for a "Server" setup)
echo "🐳 Installing Docker..."
sudo apt install -y docker.io
sudo systemctl enable docker
sudo usermod -aG docker $USER

# 4. Install Node.js (Latest LTS)
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Install Python and Pip
echo "🐍 Installing Python..."
sudo apt install -y python3 python3-pip

# 6. Cleanup
echo "🧹 Cleaning up..."
sudo apt autoremove -y

echo "✅ ALL DONE! Please restart your terminal or type 'source ~/.bashrc'"
echo "Try typing 'docker --version' or 'node -v' to check."
