# CI/CD Setup and Troubleshooting Guide

This guide will help you set up and troubleshoot GitHub Actions CI/CD for your LiftNote backend deployment.

## Prerequisites

- GitHub repository with your code
- DigitalOcean droplet with SSH access
- DigitalOcean database cluster
- Domain name pointing to your droplet

## Step 1: GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

### Required Secrets

```bash
DROPLET_HOST=your-droplet-ip-address
DROPLET_USERNAME=root
DROPLET_SSH_KEY=your-private-ssh-key-content
DROPLET_PORT=22
```

### How to Generate SSH Key

```bash
# Generate a new SSH key pair
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy the public key to your droplet
ssh-copy-id root@YOUR_DROPLET_IP

# Copy the private key content to GitHub secrets
cat ~/.ssh/id_rsa
```

## Step 2: Verify Required Files

Make sure these files exist in your repository:

- ✅ `.github/workflows/deploy-backend.yml`
- ✅ `backend/env.production`
- ✅ `docker/backend.Dockerfile`
- ✅ `docker-compose.prod.yml`
- ✅ `nginx/liftnote.conf`
- ✅ `scripts/deploy.sh`

## Step 3: Environment Variables

Ensure your `backend/env.production` file has all required variables:

```bash
# Required variables
APP_KEY=base64:your-app-key
APP_URL=https://api-liftnote.xyz
DB_HOST=your-database-host
DB_DATABASE=your-database-name
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
DO_SPACES_KEY=your-spaces-key
DO_SPACES_SECRET=your-spaces-secret
DO_SPACES_BUCKET=your-bucket-name
```

## Step 4: Test SSH Connection

Test SSH connection from your local machine:

```bash
ssh root@YOUR_DROPLET_IP
```

If successful, you should be able to SSH into your droplet.

## Step 5: Manual Deployment Test

Before relying on CI/CD, test manual deployment:

```bash
# On your droplet
cd /var/www/liftnote
./scripts/deploy.sh
```

## Step 6: GitHub Actions Workflow

The workflow will:

1. **Test Stage:**
   - Run PHP tests with MySQL
   - Verify code quality

2. **Deploy Stage (only on main branch):**
   - Build Docker image
   - SSH to droplet
   - Pull latest changes
   - Deploy with Docker Compose
   - Run migrations
   - Clear caches
   - Health check

## Common Issues and Solutions

### Issue 1: SSH Connection Failed

**Symptoms:**

- GitHub Actions fails with "SSH connection failed"
- "Permission denied" errors

**Solutions:**

1. Verify SSH key is correct in GitHub secrets
2. Ensure public key is added to droplet
3. Check droplet IP address
4. Test SSH connection manually

```bash
# Test SSH connection
ssh -o ConnectTimeout=10 -o BatchMode=yes root@YOUR_DROPLET_IP "echo 'SSH test'"
```

### Issue 2: Docker Build Failures

**Symptoms:**

- "Build failed" errors in GitHub Actions
- Missing files during build

**Solutions:**

1. Check if all required files exist
2. Verify Dockerfile syntax
3. Ensure environment variables are set
4. Check Docker build context

### Issue 3: Database Connection Issues

**Symptoms:**

- Migration failures
- "Connection refused" errors

**Solutions:**

1. Verify database credentials
2. Check if database is accessible from droplet
3. Ensure SSL certificates are configured
4. Test database connection manually

### Issue 4: Permission Denied

**Symptoms:**

- "Permission denied" errors during deployment
- Cannot write to directories

**Solutions:**

1. Ensure user has sudo privileges
2. Check file permissions
3. Run `chmod +x scripts/deploy.sh`

### Issue 5: Health Check Failures

**Symptoms:**

- Deployment succeeds but health check fails
- Application not responding

**Solutions:**

1. Check application logs
2. Verify nginx configuration
3. Check if container is running
4. Test health endpoint manually

## Troubleshooting Commands

### On Your Droplet

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View application logs
docker-compose -f docker-compose.prod.yml logs backend

# Check nginx status
sudo systemctl status nginx

# Test health endpoint
curl https://api-liftnote.xyz/health

# Check file permissions
ls -la /var/www/liftnote/scripts/

# Test database connection
docker-compose -f docker-compose.prod.yml exec backend php artisan tinker
```

### Local Testing

```bash
# Run the troubleshooting script
./scripts/troubleshoot-cicd.sh

# Test SSH connection
ssh root@YOUR_DROPLET_IP

# Check GitHub Actions logs
# Go to: https://github.com/YOUR_USERNAME/LiftNote/actions
```

## Monitoring and Debugging

### GitHub Actions Logs

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Click on the latest workflow run
4. Check the logs for specific error messages

### Application Monitoring

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/liftnote_error.log
sudo tail -f /var/log/nginx/liftnote_access.log
```

## Security Considerations

1. **SSH Keys:** Use strong SSH keys and rotate them regularly
2. **Secrets:** Never commit secrets to your repository
3. **Firewall:** Ensure only necessary ports are open
4. **Updates:** Keep your droplet and dependencies updated

## Next Steps

1. Run the troubleshooting script: `./scripts/troubleshoot-cicd.sh`
2. Check GitHub Actions logs for specific errors
3. Test manual deployment first
4. Push a small change to trigger CI/CD
5. Monitor the deployment process

## Support

If you're still having issues:

1. Check the GitHub Actions logs for specific error messages
2. Run the troubleshooting script
3. Test each component manually
4. Verify all prerequisites are met

Remember: CI/CD is a process that requires careful setup and testing. Start with manual deployment to ensure everything works, then gradually move to automated deployment.
