#!/bin/bash

# cobuddy-cli.sh - Simple shell interface for CoBuddy
# Date: 2026-05-06

set -e

# Configuration
COBUDY_API_URL="${COBUDY_API_URL:-https://api.cobuddy.com/v1/chat}"
COBUDY_API_KEY="${COBUDY_API_KEY:-}"
MODEL="${MODEL:-cobuddy}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_help() {
    cat << EOF
Usage: $0 [OPTIONS] [MESSAGE]

Interactive CoBuddy CLI shell

Options:
  -h, --help     Show this help message
  -k, --key KEY  API key (or set COBUDY_API_KEY env var)
  -u, --url URL  API URL (or set COBUDY_API_URL env var)
  -m, --model M  Model name (default: cobuddy)
  -i, --interactive  Start interactive mode

Examples:
  $0 "Hello, how are you?"
  $0 --interactive
  COBUDY_API_KEY=your_key $0 --interactive

EOF
}

send_message() {
    local message="$1"
    
    if [ -z "$COBUDY_API_KEY" ]; then
        echo -e "${RED}Error: COBUDY_API_KEY not set${NC}"
        exit 1
    fi
    
    response=$(curl -s -X POST "$COBUDY_API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $COBUDY_API_KEY" \
        -d "{
            \"model\": \"$MODEL\",
            \"messages\": [{\"role\": \"user\", \"content\": \"$message\"}],
            \"stream\": false
        }")
    
    echo "$response" | jq -r '.choices[].message.content' 2>/dev/null || echo "$response"
}

interactive_mode() {
    echo -e "${GREEN}CoBuddy CLI - Interactive Mode${NC}"
    echo -e "${BLUE}Type 'quit' or 'exit' to end${NC}"
    echo ""
    
    while true; do
        echo -n "You: "
        read -r user_input || break
        
        if [[ "$user_input" =~ ^(quit|exit)$ ]]; then
            echo "Goodbye!"
            break
        fi
        
        if [ -z "$user_input" ]; then
            continue
        fi
        
        echo -n "CoBuddy: "
        send_message "$user_input"
        echo ""
        echo ""
    done
}

# Parse arguments
if [ $# -eq 0 ]; then
    interactive_mode
elif [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    print_help
elif [ "$1" == "-i" ] || [ "$1" == "--interactive" ]; then
    interactive_mode
else
    # Treat all arguments as the message
    message="$*"
    response=$(send_message "$message")
    echo "$response"
fi
