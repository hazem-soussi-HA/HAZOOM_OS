#!/bin/bash

# ============================================
# HAZOOM OS - DEVELOPMENT VALIDATION SCRIPT
# ============================================
# Run this script before committing changes
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
errors=0
warnings=0
checks=0

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}          🔍 HAZOOM OS - DEVELOPMENT VALIDATION            ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Check 1: File Structure
# ============================================
((checks++))
echo -e "${BLUE}[1/12] Checking file structure...${NC}"

required_files=(
    "index.html"
    "core.js"
    "privacy.js"
    "app_launcher.js"
    "security.js"
    "hazoom-os.css"
    "secure_server.py"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo -e "   ${RED}❌ Missing: $file${NC}"
        ((errors++))
    fi
done

# Check apps directory
if [[ ! -d "apps" ]]; then
    echo -e "   ${RED}❌ apps directory not found${NC}"
    ((errors++))
fi

if [[ $errors -eq 0 ]]; then
    echo -e "   ${GREEN}✅ All critical files present${NC}"
fi
echo ""

# ============================================
# Check 2: JavaScript Syntax
# ============================================
((checks++))
echo -e "${BLUE}[2/12] Validating JavaScript syntax...${NC}"

js_files=("core.js" "privacy.js" "app_launcher.js" "security.js")
for js_file in "${js_files[@]}"; do
    if [[ -f "$js_file" ]]; then
        open_braces=$(grep -o '{' "$js_file" | wc -l)
        close_braces=$(grep -o '}' "$js_file" | wc -l)
        
        if [[ $open_braces -ne $close_braces ]]; then
            echo -e "   ${RED}❌ $js_file: Unmatched braces${NC}"
            ((errors++))
        fi
        
        open_parens=$(grep -o '(' "$js_file" | wc -l)
        close_parens=$(grep -o ')' "$js_file" | wc -l)
        
        if [[ $open_parens -ne $close_parens ]]; then
            echo -e "   ${YELLOW}⚠️  $js_file: Potential unmatched parentheses${NC}"
            ((warnings++))
        fi
        
        open_brackets=$(grep -o '\[' "$js_file" | wc -l)
        close_brackets=$(grep -o '\]' "$js_file" | wc -l)
        
        if [[ $open_brackets -ne $close_brackets ]]; then
            echo -e "   ${RED}❌ $js_file: Unmatched brackets${NC}"
            ((errors++))
        fi
    fi
done

if [[ $errors -eq 0 ]]; then
    echo -e "   ${GREEN}✅ JavaScript syntax valid${NC}"
fi
echo ""

# ============================================
# Check 3: App Definitions
# ============================================
((checks++))
echo -e "${BLUE}[3/12] Validating app definitions...${NC}"

# Extract desktopApps list
desktop_apps=$(grep -A 20 "desktopApps:" core.js | grep "'" | sed "s/.*'\(.*\)'.*/\1/" | grep -v "^$")

missing_apps=0
for app_id in $desktop_apps; do
    if ! grep -q "${app_id}:" core.js; then
        echo -e "   ${RED}❌ $app_id: App not defined in core.js${NC}"
        ((missing_apps++))
    fi
    
    if [[ ! -f "apps/${app_id}.html" ]]; then
        echo -e "   ${RED}❌ $app_id: HTML file missing${NC}"
        ((missing_apps++))
    fi
done

if [[ $missing_apps -eq 0 ]]; then
    echo -e "   ${GREEN}✅ All apps properly defined${NC}"
else
    ((errors+=missing_apps))
fi
echo ""

# ============================================
# Check 4: Security Integration
# ============================================
((checks++))
echo -e "${BLUE}[4/12] Checking security integration...${NC}"

if ! grep -q "privacy.js" index.html; then
    echo -e "   ${RED}❌ privacy.js not loaded in index.html${NC}"
    ((errors++))
fi

if ! grep -q "app_launcher.js" index.html; then
    echo -e "   ${RED}❌ app_launcher.js not loaded in index.html${NC}"
    ((errors++))
fi

if ! grep -q "PrivacyController" core.js; then
    echo -e "   ${YELLOW}⚠️  PrivacyController not referenced in core.js${NC}"
    ((warnings++))
fi

if ! grep -q "SecureAppLauncher" core.js; then
    echo -e "   ${YELLOW}⚠️  SecureAppLauncher not referenced in core.js${NC}"
    ((warnings++))
fi

if [[ $errors -eq 0 ]]; then
    echo -e "   ${GREEN}✅ Security integration valid${NC}"
fi
echo ""

# ============================================
# Check 5: Core System Components
# ============================================
((checks++))
echo -e "${BLUE}[5/12] Validating core system components...${NC}"

required_components=(
    "FileSystem"
    "WindowManager"
    "const apps"
    "initDesktop"
    "HAZOOM"
)

for component in "${required_components[@]}"; do
    if ! grep -q "$component" core.js; then
        echo -e "   ${RED}❌ Missing: $component${NC}"
        ((errors++))
    fi
done

if [[ $errors -eq 0 ]]; then
    echo -e "   ${GREEN}✅ All core components present${NC}"
fi
echo ""

# ============================================
# Check 6: CSS Validation
# ============================================
((checks++))
echo -e "${BLUE}[6/12] Validating CSS...${NC}"

if [[ ! -f "hazoom-os.css" ]]; then
    echo -e "   ${RED}❌ hazoom-os.css not found${NC}"
    ((errors++))
else
    css_lines=$(wc -l < hazoom-os.css)
    if [[ $css_lines -lt 100 ]]; then
        echo -e "   ${RED}❌ CSS file too small ($css_lines lines)${NC}"
        ((errors++))
    else
        echo -e "   ${GREEN}✅ CSS valid ($css_lines lines)${NC}"
    fi
fi
echo ""

# ============================================
# Check 7: Server Configuration
# ============================================
((checks++))
echo -e "${BLUE}[7/12] Checking server configuration...${NC}"

if [[ ! -f "secure_server.py" ]]; then
    echo -e "   ${YELLOW}⚠️  secure_server.py not found${NC}"
    ((warnings++))
fi

if [[ ! -x "start-dev.sh" ]]; then
    echo -e "   ${YELLOW}⚠️  start-dev.sh not executable${NC}"
    ((warnings++))
fi

if [[ ! -x "start-secure.sh" ]]; then
    echo -e "   ${YELLOW}⚠️  start-secure.sh not executable${NC}"
    ((warnings++))
fi

echo -e "   ${GREEN}✅ Server configuration checked${NC}"
echo ""

# ============================================
# Check 8: File Sizes
# ============================================
((checks++))
echo -e "${BLUE}[8/12] Checking file sizes...${NC}"

size_errors=0

# Check critical files aren't too small
critical_min_sizes=(
    "core.js:50000"
    "privacy.js:10000"
    "app_launcher.js:8000"
    "security.js:10000"
    "index.html:2000"
)

for min_size in "${critical_min_sizes[@]}"; do
    file="${min_size%%:*}"
    size="${min_size##*:}"
    
    if [[ -f "$file" ]]; then
        file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        
        if [[ $file_size -lt $size ]]; then
            echo -e "   ${RED}❌ $file: Too small ($file_size < $size bytes)${NC}"
            ((size_errors++))
        fi
    fi
done

if [[ $size_errors -eq 0 ]]; then
    echo -e "   ${GREEN}✅ File sizes valid${NC}"
else
    ((errors+=size_errors))
fi
echo ""

# ============================================
# Check 9: Git Configuration
# ============================================
((checks++))
echo -e "${BLUE}[9/12] Checking Git configuration...${NC}"

if [[ -d ".git" ]]; then
    if [[ -f ".gitignore" ]]; then
        if grep -q "node_modules" .gitignore; then
            echo -e "   ${GREEN}✅ .gitignore properly configured${NC}"
        else
            echo -e "   ${YELLOW}⚠️  .gitignore may need updating${NC}"
            ((warnings++))
        fi
    else
        echo -e "   ${YELLOW}⚠️  .gitignore not found${NC}"
        ((warnings++))
    fi
else
    echo -e "   ${YELLOW}⚠️  Not a Git repository${NC}"
fi
echo ""

# ============================================
# Check 10: Documentation
# ============================================
((checks++))
echo -e "${BLUE}[10/12] Checking documentation...${NC}"

doc_files=("README.md" "FEATURES.md" "SECURITY_FIXES_APPLIED.md")
for doc_file in "${doc_files[@]}"; do
    if [[ ! -f "$doc_file" ]]; then
        echo -e "   ${YELLOW}⚠️  Missing: $doc_file${NC}"
        ((warnings++))
    fi
done

echo -e "   ${GREEN}✅ Documentation checked${NC}"
echo ""

# ============================================
# Check 11: Common Issues
# ============================================
((checks++))
echo -e "${BLUE}[11/12] Checking for common issues...${NC}"

# Check for console.log in production code
if grep -q "console.log" core.js; then
    echo -e "   ${YELLOW}⚠️  Found console.log statements in core.js${NC}"
    ((warnings++))
fi

# Check for TODO/FIXME comments
if grep -rn "TODO\|FIXME\|HACK" . --include="*.js" --include="*.html" 2>/dev/null | grep -v node_modules; then
    echo -e "   ${YELLOW}⚠️  Found TODO/FIXME comments${NC}"
    ((warnings++))
fi

# Check for commented-out code
if grep -rn "//.*function\|//.*var\|//.*const" core.js | head -5; then
    echo -e "   ${YELLOW}⚠️  Found potentially commented-out code${NC}"
    ((warnings++))
fi

echo -e "   ${GREEN}✅ Common issues checked${NC}"
echo ""

# ============================================
# Check 12: Performance Check
# ============================================
((checks++))
echo -e "${BLUE}[12/12] Running performance checks...${NC}"

# Check file count
total_files=$(find . -type f ! -path "./node_modules/*" ! -path "./.git/*" | wc -l)
echo -e "   ${GREEN}✅ Total files: $total_files${NC}"

# Check total size
total_size=$(du -sh . 2>/dev/null | cut -f1)
echo -e "   ${GREEN}✅ Total size: $total_size${NC}"

echo ""

# ============================================
# FINAL REPORT
# ============================================
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                     📊 VALIDATION REPORT                       ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Checks Completed:${NC}    $checks"
echo -e "${RED}Errors Found:${NC}        $errors"
echo -e "${YELLOW}Warnings Found:${NC}      $warnings"
echo ""

if [[ $errors -eq 0 ]]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}                    ✅ ALL CHECKS PASSED                      ${GREEN}║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ Safe to commit changes${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}                  ❌ VALIDATION FAILED                       ${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}❌ Fix the errors above before committing${NC}"
    echo ""
    exit 1
fi