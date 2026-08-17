#!/usr/bin/env bash
# HAZOOM OS — Dev Machine Provisioner
# Runs INSIDE a Juju machine (via `juju ssh <machine>`) to turn a bare
# LXD container into a microservice dev environment:
#   git + node + repo clone + service dev server + prepared runner
#
# Usage (on the juju controller host):
#   juju ssh <machine> 'bash -s' < scripts/provision-dev-machine.sh <service>
#
# Copyright © 2024-2026 Hazem Soussi — All Rights Reserved

set -euo pipefail

SERVICE="${1:-}"
REPO_URL="${REPO_URL:-git@github.com:hazem-soussi-HA/HAZOOM_OS.git}"
BRANCH="${BRANCH:-develop}"
DEV_ROOT="/opt/hazoom-dev"

if [ -z "$SERVICE" ]; then
    echo "usage: provision-dev-machine.sh <service-name>" >&2
    exit 1
fi

echo "==> [${SERVICE}] installing base toolchain"
export DEBIAN_FRONTEND=noninteractive
SUDO=""
if [ "$(id -u)" != "0" ]; then SUDO="sudo"; fi
${SUDO} apt-get update -qq
${SUDO} apt-get install -yqq git curl ca-certificates >/dev/null

if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    ${SUDO} apt-get install -yqq nodejs >/dev/null
fi

echo "==> [${SERVICE}] cloning HAZOOM_OS (${BRANCH})"
${SUDO} mkdir -p "${DEV_ROOT}"
${SUDO} chown -R "$(id -un):$(id -gn)" "${DEV_ROOT}" 2>/dev/null || true
if [ ! -d "${DEV_ROOT}/HAZOOM_OS/.git" ]; then
    git clone --depth 1 --branch "${BRANCH}" "${REPO_URL}" "${DEV_ROOT}/HAZOOM_OS" 2>/dev/null \
        || git clone --depth 1 "https://github.com/hazem-soussi-HA/HAZOOM_OS.git" "${DEV_ROOT}/HAZOOM_OS"
fi

SVC_DIR="${DEV_ROOT}/HAZOOM_OS/services/${SERVICE}"
echo "==> [${SERVICE}] service dir: ${SVC_DIR}"

if [ -f "${SVC_DIR}/package.json" ]; then
    echo "==> [${SERVICE}] installing npm dependencies"
    (cd "${SVC_DIR}" && npm install --no-audit --no-fund --loglevel=error) || \
        echo "==> [${SERVICE}] npm install failed (documented, continuing)"
fi

# systemd unit: run the service dev server on boot
SERVER_MAIN=""
if [ -f "${SVC_DIR}/server.js" ]; then
    SERVER_MAIN="server.js"
elif [ -f "${SVC_DIR}/server/server.js" ]; then
    SERVER_MAIN="server/server.js"
elif [ -f "${SVC_DIR}/server/index.js" ]; then
    SERVER_MAIN="server/index.js"
fi
if [ -n "${SERVER_MAIN}" ]; then
    UNIT="hazoom-dev-${SERVICE}.service"
    cat > "/tmp/${UNIT}" <<EOF
[Unit]
Description=HAZOOM OS dev microservice — ${SERVICE}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=${SVC_DIR}
ExecStart=/usr/bin/node ${SERVER_MAIN}
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=development
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    ${SUDO} mv "/tmp/${UNIT}" "/etc/systemd/system/${UNIT}"
    ${SUDO} systemctl daemon-reload
    ${SUDO} systemctl enable "${UNIT}" >/dev/null 2>&1 || true
    echo "==> [${SERVICE}] systemd unit installed (hazoom-dev-${SERVICE})"
fi

# GitHub Actions self-hosted runner (prepared, registration deferred)
RUNNER_DIR="/opt/actions-runner"
if [ ! -d "${RUNNER_DIR}" ]; then
    mkdir -p "${RUNNER_DIR}"
    LATEST=$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest 2>/dev/null \
        | grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "${LATEST}" ]; then
        VER="${LATEST#v}"
        curl -fsSL -o /tmp/runner.tar.gz \
            "https://github.com/actions/runner/releases/download/${LATEST}/actions-runner-linux-x64-${VER}.tar.gz" \
            && tar -xzf /tmp/runner.tar.gz -C "${RUNNER_DIR}" || echo "==> [${SERVICE}] runner download failed (defer)"
        (cd "${RUNNER_DIR}" && ./bin/installdependencies.sh >/dev/null 2>&1) || true
        echo "==> [${SERVICE}] runner extracted to ${RUNNER_DIR} — register with:"
        echo "    cd ${RUNNER_DIR} && ./config.sh --url https://github.com/hazem-soussi-HA/HAZOOM_OS --token <TOKEN>"
    fi
fi

echo "==> [${SERVICE}] provision complete"
hostname
node --version
git -C "${DEV_ROOT}/HAZOOM_OS" log --oneline -1 2>/dev/null || true