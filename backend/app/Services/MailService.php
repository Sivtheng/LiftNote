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