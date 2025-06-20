<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MailService;

class TestMailConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test {email? : Email address to send test to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the mail configuration by sending a test email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email') ?: env('MAIL_FROM_ADDRESS');
        
        $this->info('Testing mail configuration...');
        $this->info('Mail Host: ' . env('MAIL_HOST'));
        $this->info('Mail Port: ' . env('MAIL_PORT'));
        $this->info('Mail Username: ' . env('MAIL_USERNAME'));
        $this->info('From Address: ' . env('MAIL_FROM_ADDRESS'));
        $this->info('To Address: ' . $email);
        
        $this->newLine();
        
        if (MailService::testMailConfiguration($email)) {
            $this->info('✅ Mail configuration test successful!');
            $this->info('Test email sent to: ' . $email);
            
            if (env('MAIL_HOST') === 'smtp.mailtrap.io') {
                $this->newLine();
                $this->warn('📧 This is a Mailtrap test email. Check your Mailtrap inbox to view the email.');
                $this->info('Mailtrap URL: https://mailtrap.io/inboxes');
            }
        } else {
            $this->error('❌ Mail configuration test failed!');
            $this->error('Check your mail configuration and try again.');
            return 1;
        }
        
        return 0;
    }
} 