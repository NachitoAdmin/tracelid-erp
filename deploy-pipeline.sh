#!/bin/bash
# TRACELID Deployment Pipeline - Non-Interactive Mode
# DEV → E2E Tests → PROD
# Usage: ./deploy-pipeline.sh [--skip-tests]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEV_URL="https://erp-nextjs-jqbv317l2-nachitoadmins-projects.vercel.app"
PROD_URL="https://www.tracelid.com"
SKIP_TESTS=false

# Use token from environment
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TRACELID DEPLOYMENT PIPELINE                       ║${NC}"
echo -e "${BLUE}║     DEV → E2E Tests → PROD                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Install Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Check Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN environment variable not set${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Vercel token configured${NC}"
fi
echo ""

# Step 1: Deploy to DEV
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 1: DEPLOY TO DEV${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}🚀 Deploying to DEV environment...${NC}"
echo "   Project: erp-nextjs-dev"
echo ""

# Deploy to DEV using non-interactive mode
DEPLOY_OUTPUT=$(vercel --yes --token="$VERCEL_TOKEN" 2>&1) || {
    echo -e "${RED}❌ DEV deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
}

# Extract the deployment URL
DEV_DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^ ]+\.vercel\.app' | tail -n1)

echo -e "${GREEN}✅ DEV deployment successful!${NC}"
echo "   URL: $DEV_DEPLOY_URL"
echo ""

# Step 2: Run E2E Tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  STEP 2: RUN E2E TESTS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${YELLOW}🧪 Running E2E tests against DEV...${NC}"
    echo "   Target: $DEV_DEPLOY_URL"
    echo ""
    
    # Install playwright if needed
    if [ ! -d "node_modules/@playwright/test" ]; then
        echo "Installing Playwright..."
        npm install
        npx playwright install chromium
    fi
    
    # Run E2E tests
    export BASE_URL="$DEV_DEPLOY_URL"
    if npx playwright test --reporter=list; then
        echo -e "${GREEN}✅ All E2E tests passed!${NC}"
        TESTS_PASSED=true
    else
        echo -e "${RED}❌ E2E tests failed!${NC}"
        TESTS_PASSED=false
    fi
    echo ""
    
    # If tests failed, stop here
    if [ "$TESTS_PASSED" = false ]; then
        echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  DEPLOYMENT BLOCKED${NC}"
        echo -e "${RED}  E2E tests failed. Fix issues before deploying to PROD.${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
        echo ""
        echo "Test report: playwright-report/index.html"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping E2E tests (--skip-tests flag)${NC}"
    echo ""
    TESTS_PASSED=true
fi

# Step 3: Deploy to PROD
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STEP 3: DEPLOY TO PRODUCTION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ "$TESTS_PASSED" = true ]; then
    echo -e "${YELLOW}🚀 Deploying to PRODUCTION...${NC}"
    echo "   Project: erp-nextjs (Production)"
    echo "   URL: $PROD_URL"
    echo ""
    
    # Deploy to production using non-interactive mode
    if vercel --prod --yes --token="$VERCEL_TOKEN" 2>&1; then
        echo -e "${GREEN}✅ PRODUCTION deployment successful!${NC}"
        echo "   URL: $PROD_URL"
        echo ""
        
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 DEPLOYMENT PIPELINE COMPLETE!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
        echo ""
        echo "Summary:"
        echo "  ✅ DEV: $DEV_DEPLOY_URL"
        if [ "$SKIP_TESTS" = false ]; then
            echo "  ✅ E2E Tests: PASSED"
        else
            echo "  ⚠️  E2E Tests: SKIPPED"
        fi
        echo "  ✅ PROD: $PROD_URL"
        echo ""
    else
        echo -e "${RED}❌ PRODUCTION deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Cannot deploy to PROD - tests failed${NC}"
    exit 1
fi
