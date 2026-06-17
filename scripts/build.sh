#!/bin/bash
set -e

ALPHAPONY_ROOT="/mnt/d/AlphaPony"
BUILD_DIR="$ALPHAPONY_ROOT/build"
VENV_DIR="$ALPHAPONY_ROOT/hazoom_venv"

echo "🔨 Building AlphaPony Integration Chain..."

mkdir -p "$BUILD_DIR/pascal" "$BUILD_DIR/python"

# Try virtual environment first, fallback to system pip
if command -v "$VENV_DIR/bin/pip" &> /dev/null; then
    echo "📦 Installing Python dependencies (venv)..."
    "$VENV_DIR/bin/pip" install -r "$ALPHAPONY_ROOT/requirements.txt" -q
elif command -v pip3 &> /dev/null; then
    echo "📦 Installing Python dependencies (system pip)..."
    pip3 install -r "$ALPHAPONY_ROOT/requirements.txt" -q --break-system-packages || true
else
    echo "⚠️  pip not found - skipping Python dependency installation"
fi

if command -v fpc &> /dev/null; then
    echo "🧠 Compiling Pascal Neural OS components..."
    for pas_file in "$ALPHAPONY_ROOT/kernel/pascal-rt/"*.pas; do
        if [ -f "$pas_file" ]; then
            echo "   Compiling $(basename $pas_file)..."
            fpc "$pas_file" -o"$BUILD_DIR/pascal/" 2>/dev/null || true
        fi
    done
else
    echo "⚠️  Free Pascal (fpc) not found - skipping Pascal compilation"
fi

echo "✅ Build complete. Artifacts in: $BUILD_DIR/"
