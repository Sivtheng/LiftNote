#!/bin/bash

# CI/CD Troubleshooting script for LiftNote
set -e

echo "🔍 CI/CD Troubleshooting Script for LiftNote"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[HEADER]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found. Please run this script from the project root."
    exit 1
fi

print_header "1. Checking GitHub Secrets Configuration"
echo "Make sure you have the following secrets in your GitHub repository:"
echo "   - DROPLET_HOST: Your DigitalOcean droplet IP"
echo "   - DROPLET_USERNAME: Usually 'root'"
echo "   - DROPLET_SSH_KEY: Your private SSH key"
echo "   - DROPLET_PORT: Usually '22'"
echo ""

print_header "2. Checking SSH Connection"
if [ -n "$DROPLET_HOST" ]; then
    print_status "Testing SSH connection to $DROPLET_HOST..."
    if ssh -o ConnectTimeout=10 -o BatchMode=yes root@$DROPLET_HOST "echo 'SSH connection successful'" 2>/dev/null; then
        print_status "✅ SSH connection is working"
    else
        print_error "❌ SSH connection failed. Check your SSH key and droplet IP"
        print_warning "Make sure your SSH key is properly configured in GitHub secrets"
    fi
else
    print_warning "DROPLET_HOST not set. Cannot test SSH connection"
fi

print_header "3. Checking Required Files"
files_to_check=(
    "backend/env.production"
    "docker/backend.Dockerfile"
    "docker-compose.prod.yml"
    "nginx/liftnote.conf"
    ".github/workflows/deploy-backend.yml"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        print_status "✅ $file exists"
    else
        print_error "❌ $file missing"
    fi
done

print_header "4. Checking Docker Configuration"
if command -v docker &> /dev/null; then
    print_status "✅ Docker is installed"
    if docker info &> /dev/null; then
        print_status "✅ Docker daemon is running"
    else
        print_error "❌ Docker daemon is not running"
    fi
else
    print_error "❌ Docker is not installed"
fi

print_header "5. Checking Nginx Configuration"
if [ -f "nginx/liftnote.conf" ]; then
    print_status "Checking nginx configuration syntax..."
    if sudo nginx -t 2>/dev/null; then
        print_status "✅ Nginx configuration is valid"
    else
        print_error "❌ Nginx configuration has errors"
    fi
else
    print_warning "nginx/liftnote.conf not found"
fi

print_header "6. Checking Environment Variables"
if [ -f "backend/env.production" ]; then
    print_status "Checking required environment variables..."
    
    required_vars=(
        "APP_KEY"
        "APP_URL"
        "DB_HOST"
        "DB_DATABASE"
        "DB_USERNAME"
        "DB_PASSWORD"
        "DO_SPACES_KEY"
        "DO_SPACES_SECRET"
        "DO_SPACES_BUCKET"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" backend/env.production; then
            print_status "✅ $var is set"
        else
            print_warning "⚠️ $var is not set"
        fi
    done
else
    print_error "❌ backend/env.production not found"
fi

print_header "7. Checking GitHub Actions Workflow"
if [ -f ".github/workflows/deploy-backend.yml" ]; then
    print_status "✅ GitHub Actions workflow exists"
    
    # Check if workflow has proper triggers
    if grep -q "branches: \[ main, develop \]" .github/workflows/deploy-backend.yml; then
        print_status "✅ Workflow triggers are configured"
    else
        print_warning "⚠️ Workflow triggers might not be configured properly"
    fi
else
    print_error "❌ GitHub Actions workflow not found"
fi

print_header "8. Checking Recent GitHub Actions Runs"
echo "To check recent runs, go to: https://github.com/YOUR_USERNAME/LiftNote/actions"
echo "Look for any failed runs and check the logs for specific errors"
echo ""

print_header "9. Common Issues and Solutions"

echo "Issue 1: SSH Key Problems"
echo "Solution:"
echo "  - Generate a new SSH key pair: ssh-keygen -t rsa -b 4096 -C 'your-email@example.com'"
echo "  - Add public key to droplet: ssh-copy-id root@YOUR_DROPLET_IP"
echo "  - Add private key to GitHub secrets as DROPLET_SSH_KEY"
echo ""

echo "Issue 2: Permission Denied"
echo "Solution:"
echo "  - Make sure the user has sudo privileges on the droplet"
echo "  - Check file permissions: chmod +x scripts/deploy.sh"
echo ""

echo "Issue 3: Docker Build Failures"
echo "Solution:"
echo "  - Check if all required files are present"
echo "  - Verify Dockerfile syntax"
echo "  - Check if environment variables are properly set"
echo ""

echo "Issue 4: Database Connection Issues"
echo "Solution:"
echo "  - Verify database credentials in env.production"
echo "  - Check if database is accessible from droplet"
echo "  - Ensure SSL certificates are properly configured"
echo ""

print_header "10. Manual Deployment Test"
echo "To test deployment manually, run:"
echo "  ./scripts/deploy.sh"
echo ""

print_header "11. Health Check"
echo "To check if the application is running:"
echo "  curl https://api-liftnote.xyz/health"
echo ""

print_status "🔍 Troubleshooting complete!"
print_warning "If you're still having issues, check the GitHub Actions logs for specific error messages" 