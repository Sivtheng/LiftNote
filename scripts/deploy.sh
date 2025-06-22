#!/bin/bash

# Deployment script for LiftNote backend
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    print_error "docker-compose.prod.yml not found. Please run this script from the project root."
    exit 1
fi

# Backup current deployment
print_status "Creating backup of current deployment..."
if [ -d "/var/www/liftnote" ]; then
    sudo cp -r /var/www/liftnote /var/www/liftnote.backup.$(date +%Y%m%d_%H%M%S)
fi

# Pull latest changes
print_status "Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Remove old images to free up space
print_status "Cleaning up old Docker images..."
docker system prune -f

# Build and start new containers
print_status "Building and starting new containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for container to be healthy
print_status "Waiting for container to be healthy..."
sleep 30

# Check if container is running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_error "Container failed to start. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend php artisan migrate --force

# Clear and cache config
print_status "Clearing and caching configuration..."
docker-compose -f docker-compose.prod.yml exec -T backend php artisan config:cache
docker-compose -f docker-compose.prod.yml exec -T backend php artisan route:cache
docker-compose -f docker-compose.prod.yml exec -T backend php artisan view:cache

# Set proper permissions
print_status "Setting proper permissions..."
docker-compose -f docker-compose.prod.yml exec -T backend chown -R www-data:www-data /var/www/html/storage
docker-compose -f docker-compose.prod.yml exec -T backend chown -R www-data:www-data /var/www/html/bootstrap/cache

# Restart nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx

# Health check
print_status "Performing health check..."
sleep 10
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Health check passed!"
else
    print_warning "⚠️  Health check failed. Please check the application manually."
fi

# Clean up old backups (keep last 5)
print_status "Cleaning up old backups..."
cd /var/www
ls -t | grep "liftnote.backup" | tail -n +6 | xargs -r sudo rm -rf

print_status "🎉 Deployment completed successfully!"
print_status "Application is now running at: https://api.yourdomain.com" 