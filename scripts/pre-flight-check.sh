#!/bin/bash

# ============================================
# HAZOOM OS - PERSISTENT FIXES PRE-FLIGHT CHECK
# ============================================
# Run this before making any changes
# Ensures system is in stable state
# ============================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 HAZOOM OS - Pre-Flight Check${NC}"
echo ""

# ============================================
# CRITICAL: Verify we're in correct directory
# ============================================
if [[ ! -f "core.js" ]]; then
    echo -e "${RED}❌ CRITICAL: Not in HAZOOM OS directory${NC}"
    echo -e "${RED}   Current: $(pwd)${NC}"
    echo -e "${YELLOW}   Required: /g/hazoom-os${NC}"
    echo ""
    echo -e "${YELLOW}🛑 STOP - DO NOT PROCEED${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Directory verified: $(pwd)${NC}"
echo ""

# ============================================
# Check server status
# ============================================
echo -e "${BLUE}📊 Checking server status...${NC}"

if ps aux | grep -v grep | grep -q "python.*8000"; then
    echo -e "${YELLOW}⚠️  Server already running on port 8000${NC}"
    echo -e "${YELLOW}   Consider running: pkill -f 'python.*8000'${NC}"
else
    echo -e "${GREEN}✅ No server running on port 8000${NC}"
fi

if ps aux | grep -v grep | grep -q "python.*8889"; then
    echo -e "${YELLOW}⚠️  Secure server already running on port 8889${NC}"
else
    echo -e "${GREEN}✅ No server running on port 8889${NC}"
fi

echo ""

# ============================================
# Quick file check
# ============================================
echo -e "${BLUE}📁 Checking critical files...${NC}"

critical_files=(
    "index.html:3KB"
    "core.js:50KB"
    "privacy.js:10KB"
    "app_launcher.js:8KB"
    "security.js:10KB"
    "hazoom-os.css:15KB"
)

all_present=true
for file_info in "${critical_files[@]}"; do
    file="${file_info%%:*}"
    min_size="${file_info##*:}"
    
    if [[ -f "$file" ]]; then
        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [[ $size -gt 1000 ]]; then
            echo -e "   ${GREEN}✅${NC} $file"
        else
            echo -e "   ${RED}❌${NC} $file (too small)"
            all_present=false
        fi
    else
        echo -e "   ${RED}❌${NC} $file (missing)"
        all_present=false
    fi
done

if [[ "$all_present" = true ]]; then
    echo -e "${GREEN}✅ All critical files present${NC}"
else
    echo -e "${RED}❌ Some critical files missing or corrupt${NC}"
    exit 1
fi

echo ""

# ============================================
# Quick syntax check
# ============================================
echo -e "${BLUE}🔍 Quick syntax check...${NC}"

js_files=("core.js" "privacy.js" "app_launcher.js")
syntax_ok=true

for js in "${js_files[@]}"; do
    if [[ -f "$js" ]]; then
        open_braces=$(grep -o '{' "$js" | wc -l)
        close_braces=$(grep -o '}' "$js" | wc -l)
        
        if [[ $open_braces -ne $close_braces ]]; then
            echo -e "   ${RED}❌${NC} $js: Unmatched braces"
            syntax_ok=false
        else
            echo -e "   ${GREEN}✅${NC} $js: Syntax OK"
        fi
    fi
done

if [[ "$syntax_ok" = false ]]; then
    echo -e "${RED}❌ Syntax errors found${NC}"
    echo -e "${YELLOW}   Run: bash validate-dev.sh${NC}"
    exit 1
fi

echo ""

# ============================================
# Check for previous fixes
# ============================================
echo -e "${BLUE}🔍 Checking for previous fixes...${NC}"

# Check if security_settings is in desktopApps
if grep -q "security_settings" core.js; then
    echo -e "   ${GREEN}✅${NC} security_settings app defined"
else
    echo -e "   ${RED}❌${NC} security_settings app missing"
    echo -e "${YELLOW}   Run: bash apply-persistent-fixes.sh${NC}"
fi

# Check if secure_scraper is in desktopApps
if grep -q "secure_scraper" core.js; then
    echo -e "   ${GREEN}✅${NC} secure_scraper app defined"
else
    echo -e "   ${RED}❌${NC} secure_scraper app missing"
fi

echo ""

# ============================================
# Summary
# ============================================
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Pre-Flight Check Passed${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🚀 Safe to proceed with development${NC}"
echo ""
echo -e "${YELLOW}Quick Start Commands:${NC}"
echo -e "  ./start-dev.sh              - Start development server"
echo -e "  ./start-secure.sh           - Start secure server"
echo -e "  bash validate-dev.sh        - Validate code"
echo -e "  http://localhost:8000       - Access HAZOOM OS"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT REMINDERS:${NC}"
echo -e "  • ALWAYS start server from /g/hazoom-os directory"
echo -e "  • ALWAYS run validate-dev.sh before committing"
echo -e "  • ALWAYS check browser console (F12) for errors"
echo -e "  • NEVER start server from /g or parent directories"
echo ""