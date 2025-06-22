# Email Notification System

This document describes the email notification system implemented in LiftNote for coach-client communication.

## Overview

The notification system automatically sends emails to clients when coaches perform certain actions:

1. **Comment Notifications**: When a coach adds a new comment or reply to a client's program

## Features

### Comment Notifications

- **Trigger**: Coach adds a comment or reply to a client's program
- **Recipient**: Client assigned to the program
- **Content**: Includes coach name, program title, and comment content
- **Differentiation**: Separate handling for new comments vs replies

## Implementation Details

### MailService Class

Located at `app/Services/MailService.php`

#### Methods

- `sendCommentNotification()`: Sends comment/reply notifications
- `sendPasswordResetEmail()`: Existing password reset functionality

### Email Templates

Located in `resources/views/emails/`

#### Templates

- `comment-notification.blade.php`: Comment and reply notifications
- `reset-password.blade.php`: Existing password reset template

### Controller Integration

#### CommentController

- **File**: `app/Http/Controllers/CommentController.php`
- **Method**: `store()` - Sends notification when comment is created
- **Logic**: Only sends if coach/admin is commenting on client's program

## Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM_ADDRESS=noreply@liftnote.xyz
MAIL_FROM_NAME=LiftNote
FRONTEND_URL=https://liftnote.xyz
```

### Mailtrap Setup

For testing, use Mailtrap to catch all emails:

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials from your inbox
3. Update environment variables
4. Check Mailtrap inbox to view sent emails

## Testing

### Test Commands

```bash
# Test basic mail configuration
php artisan mail:test your-email@example.com

# Test notification system
php artisan mail:test-notifications your-email@example.com
```

### Manual Testing

1. **Comment Notifications**:
   - Login as a coach
   - Add a comment to a client's program
   - Check client's email for notification

## Email Templates

### Comment Notification Template

- **Subject**: "New Comment/Reply from [Coach Name] - LiftNote"
- **Content**:
  - Personalized greeting
  - Program information
  - Comment/reply content
  - Link to view in app

## Security & Privacy

### Access Control

- Only coaches and admins can trigger notifications
- Notifications only sent to program clients
- No notifications for self-comments

### Data Protection

- Email addresses are logged for debugging
- No sensitive data in email content
- Secure SMTP configuration

## Logging

### Log Entries

The system logs all notification activities:

```php
// Successful notification
Log::info('Comment notification email sent', [
    'comment_id' => $comment->id,
    'client_email' => $client->email,
    'is_reply' => $isReply
]);

// Failed notification
Log::error('Failed to send comment notification email', [
    'comment_id' => $comment->id,
    'client_email' => $client->email
]);
```

### Log Locations

- Laravel logs: `storage/logs/laravel.log`
- Mail-specific errors logged with context

## Troubleshooting

### Common Issues

#### Emails Not Sending

1. Check mail configuration in `.env`
2. Verify SMTP credentials
3. Check application logs for errors
4. Test with `php artisan mail:test`

#### Notifications Not Triggering

1. Verify user roles (coach/admin)
2. Check program relationships
3. Ensure client exists and has email
4. Review controller logic

#### Template Issues

1. Clear view cache: `php artisan view:clear`
2. Check template syntax
3. Verify template variables are passed correctly

### Debug Commands

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# Check mail configuration
php artisan config:show mail

# Test specific notification
php artisan mail:test-notifications
```

## Future Enhancements

### Potential Improvements

1. **Email Preferences**: Allow clients to opt-out of specific notifications
2. **SMS Notifications**: Add SMS support for urgent updates
3. **Push Notifications**: Mobile app push notifications
4. **Notification History**: Track sent notifications in database
5. **Custom Templates**: Allow coaches to customize email content
6. **Bulk Notifications**: Send to multiple clients at once

### Technical Considerations

1. **Queue System**: Implement queued emails for better performance
2. **Rate Limiting**: Prevent spam notifications
3. **Email Analytics**: Track open rates and engagement
4. **Template Localization**: Support multiple languages

## Support

For issues with the notification system:

1. Check application logs
2. Verify mail configuration
3. Test with provided commands
4. Review this documentation
5. Contact development team
