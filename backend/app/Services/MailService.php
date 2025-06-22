<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class MailService
{
    /**
     * Send password reset email
     *
     * @param string $email
     * @param string $token
     * @return bool
     */
    public static function sendPasswordResetEmail($email, $token)
    {
        try {
            $frontendUrl = env('FRONTEND_URL', 'https://liftnote.xyz');
            $resetUrl = $frontendUrl . '/reset-password?token=' . $token;
            
            Mail::send('emails.reset-password', [
                'token' => $token,
                'resetUrl' => $resetUrl
            ], function($message) use ($email) {
                $message->to($email);
                $message->subject('Password Reset Request - ' . env('APP_NAME', 'LiftNote'));
            });
            
            Log::info('Password reset email sent successfully', ['email' => $email]);
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email', [
                'email' => $email,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send comment notification email to client
     *
     * @param string $clientEmail
     * @param string $clientName
     * @param string $coachName
     * @param string $programTitle
     * @param string $commentContent
     * @param bool $isReply
     * @return bool
     */
    public static function sendCommentNotification($clientEmail, $clientName, $coachName, $programTitle, $commentContent, $isReply = false)
    {
        try {
            $frontendUrl = env('FRONTEND_URL', 'https://liftnote.xyz');
            $appName = env('APP_NAME', 'LiftNote');
            
            $subject = $isReply 
                ? "New Reply from {$coachName} - {$appName}"
                : "New Comment from {$coachName} - {$appName}";
            
            Mail::send('emails.comment-notification', [
                'clientName' => $clientName,
                'coachName' => $coachName,
                'programTitle' => $programTitle,
                'commentContent' => $commentContent,
                'isReply' => $isReply,
                'frontendUrl' => $frontendUrl
            ], function($message) use ($clientEmail, $subject) {
                $message->to($clientEmail);
                $message->subject($subject);
            });
            
            Log::info('Comment notification email sent successfully', [
                'email' => $clientEmail,
                'isReply' => $isReply,
                'programTitle' => $programTitle
            ]);
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to send comment notification email', [
                'email' => $clientEmail,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send program update notification email to client
     *
     * @param string $clientEmail
     * @param string $clientName
     * @param string $coachName
     * @param string $programTitle
     * @param array $changes
     * @return bool
     */
    public static function sendProgramUpdateNotification($clientEmail, $clientName, $coachName, $programTitle, $changes)
    {
        try {
            $frontendUrl = env('FRONTEND_URL', 'https://liftnote.xyz');
            $appName = env('APP_NAME', 'LiftNote');
            
            Mail::send('emails.program-update-notification', [
                'clientName' => $clientName,
                'coachName' => $coachName,
                'programTitle' => $programTitle,
                'changes' => $changes,
                'frontendUrl' => $frontendUrl
            ], function($message) use ($clientEmail, $appName) {
                $message->to($clientEmail);
                $message->subject("Program Updated - {$appName}");
            });
            
            Log::info('Program update notification email sent successfully', [
                'email' => $clientEmail,
                'programTitle' => $programTitle,
                'changes' => $changes
            ]);
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to send program update notification email', [
                'email' => $clientEmail,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Test mail configuration
     *
     * @param string $testEmail
     * @return bool
     */
    public static function testMailConfiguration($testEmail = null)
    {
        try {
            $testEmail = $testEmail ?: env('MAIL_FROM_ADDRESS');
            
            Mail::raw('This is a test email from LiftNote to verify mail configuration.', function($message) use ($testEmail) {
                $message->to($testEmail);
                $message->subject('Mail Configuration Test - ' . env('APP_NAME', 'LiftNote'));
            });
            
            Log::info('Mail configuration test successful', ['test_email' => $testEmail]);
            return true;
            
        } catch (\Exception $e) {
            Log::error('Mail configuration test failed', [
                'test_email' => $testEmail,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
} 