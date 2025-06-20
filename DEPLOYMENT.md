# LiftNote Backend Deployment Guide

This guide will help you deploy the LiftNote backend to a DigitalOcean droplet using GitHub Actions CI/CD.

## Prerequisites

- DigitalOcean account with a droplet
- GitHub repository with your code
- DigitalOcean Database cluster (already set up)
- DigitalOcean Spaces (already set up)
- Domain name pointing to your droplet

## Step 1: Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

```bash
DROPLET_HOST=your-droplet-ip
DROPLET_USERNAME=root
DROPLET_SSH_KEY=your-private-ssh-key
DROPLET_PORT=22
```

## Step 2: Configure Your Domain

1. Point your domain's A record to your DigitalOcean droplet IP
2. Create a subdomain for your API (e.g., `api.yourdomain.com`)

## Step 3: Set Up the DigitalOcean Droplet

### Option A: Automated Setup (Recommended)

1. SSH into your droplet:

   ```bash
   ssh root@your-droplet-ip
   ```

2. Clone your repository:

   ```bash
   git clone https://github.com/yourusername/LiftNote.git /var/www/liftnote
   cd /var/www/liftnote
   ```

3. Run the setup script:

   ```bash
   chmod +x scripts/setup-droplet.sh
   ./scripts/setup-droplet.sh
   ```

### Option B: Manual Setup

If you prefer manual setup, follow these steps:

1. **Update system and install packages:**

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git
   ```

2. **Set up Docker:**

   ```bash
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```

3. **Configure Nginx:**

   ```bash
   sudo cp nginx/liftnote.conf /etc/nginx/sites-available/liftnote
   sudo ln -sf /etc/nginx/sites-available/liftnote /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Set up SSL:**

   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

## Step 4: Configure Environment Variables

1. Copy the production environment template:

   ```bash
   cp backend/env.production backend/.env.production
   ```

2. Edit `backend/.env.production` with your actual values:

   ```bash
   nano backend/.env.production
   ```

   Update these values:
   - `APP_URL=https://api.yourdomain.com`
   - `FRONTEND_URL=https://yourdomain.com`
   - `DB_HOST=your-database-host`
   - `DB_DATABASE=your-database-name`
   - `DB_USERNAME=your-database-username`
   - `DB_PASSWORD=your-database-password`
   - `DO_SPACES_KEY=your-spaces-key`
   - `DO_SPACES_SECRET=your-spaces-secret`
   - `DO_SPACES_BUCKET=your-bucket-name`

3. Generate an application key:

   ```bash
   cd backend
   php artisan key:generate
   ```

## Step 5: Update Configuration Files

1. **Update Nginx configuration** (`nginx/liftnote.conf`):
   - Replace `api.yourdomain.com` with your actual domain

2. **Update GitHub Actions workflow** (`.github/workflows/deploy-backend.yml`):
   - Ensure the script path matches your setup

## Step 6: Initial Deployment

1. Run the deployment script:

   ```bash
   ./scripts/deploy.sh
   ```

2. Check if everything is working:

   ```bash
   curl https://api.yourdomain.com/health
   ```

## Step 7: Set Up GitHub Actions

1. Push your changes to the main branch
2. The GitHub Actions workflow will automatically:
   - Run tests
   - Deploy to your droplet (if tests pass)

## Monitoring and Maintenance

### View Logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/liftnote_access.log
sudo tail -f /var/log/nginx/liftnote_error.log
```

### Manual Deployment

```bash
./scripts/deploy.sh
```

### SSL Certificate Renewal

SSL certificates are automatically renewed via cron job. You can manually renew:

```bash
sudo certbot renew
```

### Backup

The deployment script automatically creates backups. To restore:

```bash
sudo cp -r /var/www/liftnote.backup.YYYYMMDD_HHMMSS /var/www/liftnote
```

## Troubleshooting

### Common Issues

1. **Container won't start:**

   ```bash
   docker-compose -f docker-compose.prod.yml logs backend
   ```

2. **Database connection issues:**
   - Check your database credentials in `.env.production`
   - Ensure your droplet can connect to the database cluster

3. **SSL certificate issues:**

   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

4. **Permission issues:**

   ```bash
   sudo chown -R $USER:$USER /var/www/liftnote
   ```

### Health Check

The application includes a health check endpoint at `/health`. You can monitor it:

```bash
curl https://api.yourdomain.com/health
```

## Security Considerations

1. **Firewall:** The setup script configures UFW firewall
2. **SSL:** Automatic SSL certificate management
3. **Updates:** Regular system updates are recommended
4. **Backups:** Automatic backup creation during deployments

## Performance Optimization

1. **Caching:** Laravel config, route, and view caching is enabled
2. **Static files:** Nginx serves static files directly
3. **Docker:** Containerized deployment for consistency

## Support

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Check network connectivity
4. Review the deployment script output
