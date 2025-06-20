# Mailtrap Setup Guide for LiftNote

This guide will help you set up Mailtrap for production email handling in your LiftNote application.

## 1. Mailtrap Account Setup

### Sign Up for Mailtrap

1. Go to [Mailtrap.io](https://mailtrap.io)
2. Create a free account
3. Navigate to your inbox

### Get SMTP Credentials

1. In your Mailtrap inbox, click on "Show Credentials"
2. Select "SMTP" tab
3. Note down:
   - **Host**: `smtp.mailtrap.io`
   - **Port**: `...`
   - **Username**: Your Mailtrap username
   - **Password**: Your Mailtrap password

## 2. Environment Configuration

### Production Environment Variables

Add these to your production environment variables:

```bash
MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@liftnote.xyz"
MAIL_FROM_NAME="LiftNote"
FRONTEND_URL="https://liftnote.xyz"
```

### DigitalOcean App Platform

If using DigitalOcean App Platform, add these environment variables in your app settings:

```bash
MAILTRAP_USERNAME=your_mailtrap_username
MAILTRAP_PASSWORD=your_mailtrap_password
FRONTEND_URL=https://liftnote.xyz
```

## 3. Testing the Configuration

### Test Mail Configuration

After deployment, test your mail configuration:

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to your application
cd /var/www/html

# Test mail configuration
php artisan mail:test your-email@example.com
```

### Expected Output

```bash
Testing mail configuration...
Mail Host: smtp.mailtrap.io
Mail Port: ...
Mail Username: your_mailtrap_username
From Address: noreply@liftnote.xyz
To Address: your-email@example.com

✅ Mail configuration test successful!
Test email sent to: your-email@example.com

📧 This is a Mailtrap test email. Check your Mailtrap inbox to view the email.
Mailtrap URL: https://mailtrap.io/inboxes
```

## 4. Verify Email Functionality

### Test Password Reset

1. Go to your application's login page
2. Click "Forgot Password"
3. Enter a valid email address
4. Check your Mailtrap inbox for the reset email
5. Click the reset link to verify it works

### Check Mailtrap Inbox

1. Log into [Mailtrap.io](https://mailtrap.io)
2. Navigate to your inbox
3. You should see the test emails and password reset emails
4. Click on any email to view its content and headers

## 5. Production Considerations

### Email Limits

- **Free Plan**: 100 emails/month
- **Paid Plans**: Higher limits available
- Monitor your usage in Mailtrap dashboard

### Security

- Mailtrap credentials are secure and encrypted
- All emails are caught and won't be delivered to real recipients
- Perfect for testing and development

### Monitoring

- Check Mailtrap dashboard regularly for email delivery
- Monitor application logs for mail errors
- Set up alerts for mail failures

## 6. Troubleshooting

### Common Issues

#### "Connection refused" Error

- Verify SMTP credentials
- Check if port 2525 is open
- Ensure TLS encryption is enabled

#### "Authentication failed" Error

- Double-check username and password
- Ensure credentials are from the correct Mailtrap inbox
- Try regenerating credentials in Mailtrap

#### Emails not appearing in Mailtrap

- Check application logs for mail errors
- Verify environment variables are set correctly
- Test with the `php artisan mail:test` command

### Debug Commands

```bash
# Check current mail configuration
php artisan config:show mail

# Test mail with verbose output
php artisan mail:test --verbose

# Clear configuration cache
php artisan config:clear
php artisan cache:clear
```

## 7. Migration to Production Email Service

When ready to send real emails to users:

1. **Choose a production email service**:
   - SendGrid
   - Mailgun
   - Amazon SES
   - Postmark

2. **Update environment variables**:

   ```bash
   MAIL_HOST=your-production-smtp-host
   MAIL_PORT=587
   MAIL_USERNAME=your-production-username
   MAIL_PASSWORD=your-production-password
   ```

3. **Test thoroughly** before switching

## 8. Support

For issues with:

- **Mailtrap**: Contact Mailtrap support
- **Application**: Check Laravel logs and application documentation
- **Deployment**: Refer to your hosting provider's documentation
