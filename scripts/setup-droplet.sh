#!/bin/bash

# Setup script for DigitalOcean droplet
set -e

echo "🔧 Setting up DigitalOcean droplet for LiftNote..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    unzip \
    certbot \
    python3-certbot-nginx \
    ufw

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
print_status "Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create project directory
print_status "Creating project directory..."
sudo mkdir -p /var/www/liftnote
sudo chown $USER:$USER /var/www/liftnote

# Navigate to project directory (repository should already be cloned)
print_status "Setting up project in existing repository..."
cd /var/www/liftnote

# Copy Nginx configuration
print_status "Setting up Nginx configuration..."
sudo cp nginx/liftnote.conf /etc/nginx/sites-available/liftnote
sudo ln -sf /etc/nginx/sites-available/liftnote /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Create environment file
print_status "Creating environment file..."
cp backend/env.production backend/.env.production

# Set up SSL certificate (you'll need to update the domain)
print_status "Setting up SSL certificate..."
sudo certbot --nginx -d api-liftnote.xyz --non-interactive --agree-tos --email sivtheng25@example.com

# Set up automatic SSL renewal
print_status "Setting up automatic SSL renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# Create log directories
print_status "Creating log directories..."
sudo mkdir -p /var/log/nginx
sudo touch /var/log/nginx/liftnote_access.log
sudo touch /var/log/nginx/liftnote_error.log

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $USER:$USER /var/www/liftnote
sudo chmod +x scripts/deploy.sh

# Start services
print_status "Starting services..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl enable docker
sudo systemctl start docker

print_status "🎉 Droplet setup completed!"
print_warning "Please update the following files with your actual values:"
print_warning "1. backend/.env.production - Update database and DigitalOcean Spaces credentials"
print_warning "2. Update your email address for SSL certificate"
print_warning "3. Run the deployment script: ./scripts/deploy.sh" 