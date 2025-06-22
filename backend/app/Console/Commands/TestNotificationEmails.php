<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MailService;

class TestNotificationEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test-notifications {email? : Email address to send test to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the notification email system by sending sample emails';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?: env('MAIL_FROM_ADDRESS');
        
        $this->info('Testing notification email system...');
        $this->info('Test email: ' . $email);
        $this->newLine();
        
        // Test comment notification
        $this->info('1. Testing comment notification...');
        $commentResult = MailService::sendCommentNotification(
            $email,
            'John Client',
            'Coach Sarah',
            'Strength Training Program',
            'Great progress on your squats today! Keep up the good work.',
            false
        );
        
        if ($commentResult) {
            $this->info('✅ Comment notification test successful!');
        } else {
            $this->error('❌ Comment notification test failed!');
        }
        
        $this->newLine();
        
        // Test reply notification
        $this->info('2. Testing reply notification...');
        $replyResult = MailService::sendCommentNotification(
            $email,
            'John Client',
            'Coach Sarah',
            'Strength Training Program',
            'Thanks for the update! Let\'s adjust your form slightly.',
            true
        );
        
        if ($replyResult) {
            $this->info('✅ Reply notification test successful!');
        } else {
            $this->error('❌ Reply notification test failed!');
        }
        
        $this->newLine();
        
        // Test program update notification
        $this->info('3. Testing program update notification...');
        $programResult = MailService::sendProgramUpdateNotification(
            $email,
            'John Client',
            'Coach Sarah',
            'Strength Training Program',
            [
                'title' => 'Updated Strength Training Program',
                'status' => 'active',
                'description' => 'Modified program with new exercises'
            ]
        );
        
        if ($programResult) {
            $this->info('✅ Program update notification test successful!');
        } else {
            $this->error('❌ Program update notification test failed!');
        }
        
        $this->newLine();
        
        if (env('MAIL_HOST') === 'smtp.mailtrap.io') {
            $this->warn('📧 These are Mailtrap test emails. Check your Mailtrap inbox to view the emails.');
            $this->info('Mailtrap URL: https://mailtrap.io/inboxes');
        }
        
        $this->info('🎉 Notification email testing completed!');
        
        return 0;
    }
} 