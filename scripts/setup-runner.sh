#!/bin/bash
# HAZOOM OS V3 — Self-Hosted GitHub Actions Runner Setup
# Creator: Hazem Soussi
# Usage: ./setup-runner.sh <GITHUB_REPO_URL> <RUNNER_TOKEN>

set -e

RUNNER_DIR="/opt/github-runner"
RUNNER_VERSION="2.321.0"
SERVICE_NAME="github-runner-hazoom"

echo "========================================="
echo "  HAZOOM OS — Self-Hosted Runner Setup"
echo "========================================="

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Run as root (sudo)"
    exit 1
fi

# Install dependencies
echo "[1/6] Installing dependencies..."
apt-get update -qq
apt-get install -y -qq curl jq unzip systemd > /dev/null 2>&1

# Create runner directory
echo "[2/6] Creating runner directory..."
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Download runner
echo "[3/6] Downloading GitHub Actions runner v${RUNNER_VERSION}..."
if [ ! -f "run.sh" ]; then
    curl -sL "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" -o runner.tar.gz
    tar xzf runner.tar.gz
    rm runner.tar.gz
    echo "Downloaded successfully"
else
    echo "Runner already exists"
fi

# Configure runner
echo "[4/6] Configuring runner..."
if [ -n "$1" ] && [ -n "$2" ]; then
    ./config.sh --unattended \
        --url "$1" \
        --token "$2" \
        --name "hazoom-os-runner" \
        --labels "hazoom,self-hosted,linux" \
        --work "_work" \
        --replace
else
    echo "Usage: sudo ./setup-runner.sh <REPO_URL> <TOKEN>"
    echo "Get token from: GitHub Repo > Settings > Actions > Runners > New self-hosted runner"
    exit 1
fi

# Create systemd service
echo "[5/6] Creating systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=HAZOOM OS GitHub Actions Runner
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${RUNNER_DIR}
ExecStart=${RUNNER_DIR}/run.sh
Restart=always
RestartSec=3
Environment=HOME=${RUNNER_DIR}
Environment=NODE_OPTIONS=--max-old-space-size=4096

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl start ${SERVICE_NAME}

echo "[6/6] Runner status:"
systemctl status ${SERVICE_NAME} --no-pager | head -10

echo ""
echo "========================================="
echo "  Runner installed successfully!"
echo "  Service: systemctl status ${SERVICE_NAME}"
echo "  Logs:    journalctl -u ${SERVICE_NAME} -f"
echo "========================================="
