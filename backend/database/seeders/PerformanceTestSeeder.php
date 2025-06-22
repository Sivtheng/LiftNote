<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Program;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use App\Models\ProgressLog;
use App\Models\Comment;
use Illuminate\Support\Facades\Hash;

class PerformanceTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 5 clients with hardcoded data
        $clients = [];
        for ($i = 1; $i <= 5; $i++) {
            $clients[$i] = User::updateOrCreate(
                ['email' => "client{$i}@liftnote.com"],
                [
                    'name' => "Client {$i}",
                    'password' => Hash::make('password123'),
                    'role' => 'client',
                    'email_verified_at' => now(),
                    'phone_number' => "555-000{$i}",
                    'bio' => "Performance test client {$i}",
                ]
            );
        }

        // Get the coach
        $coach = User::where('role', 'coach')->first();
        if (!$coach) {
            $this->command->error('No coach found. Please run the main DatabaseSeeder first.');
            return;
        }

        // Create programs, weeks, days, progress logs, and comments for each client
        foreach ($clients as $i => $client) {
            // Create a program for the client
            $program = Program::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'title' => "Performance Test Program {$i}"
                ],
                [
                    'coach_id' => $coach->id,
                    'description' => "Test program for Client {$i} - Strength training and cardio",
                    'status' => 'active',
                    'total_weeks' => 8,
                    'completed_weeks' => rand(0, 4),
                    'current_week_id' => null,
                    'current_day_id' => null,
                ]
            );

            // Create a week for the program
            $week = ProgramWeek::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'order' => 1
                ],
                [
                    'name' => "Week 1",
                ]
            );

            // Create a day for the week
            $day = ProgramDay::updateOrCreate(
                [
                    'week_id' => $week->id,
                    'order' => 1
                ],
                [
                    'name' => "Day 1",
                ]
            );

            // Add 3 progress logs
            for ($j = 1; $j <= 3; $j++) {
                ProgressLog::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'user_id' => $client->id,
                        'completed_at' => now()->subDays($j * 2)
                    ],
                    [
                        'exercise_id' => null,
                        'week_id' => $week->id,
                        'day_id' => $day->id,
                        'weight' => rand(50, 200),
                        'reps' => rand(8, 15),
                        'time_seconds' => rand(1800, 3600), // 30-60 minutes
                        'rpe' => rand(6, 9),
                        'workout_duration' => rand(1800, 3600),
                        'is_rest_day' => false,
                    ]
                );
            }

            // Add 2 comments (one from client, one from coach)
            Comment::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'user_id' => $client->id,
                    'content' => "Client {$i} comment: Great workout today!"
                ],
                [
                    'media_type' => null,
                    'media_url' => null,
                    'parent_id' => null,
                ]
            );

            Comment::updateOrCreate(
                [
                    'program_id' => $program->id,
                    'user_id' => $coach->id,
                    'content' => "Coach comment: Keep up the good work, Client {$i}!"
                ],
                [
                    'media_type' => null,
                    'media_url' => null,
                    'parent_id' => null,
                ]
            );
        }

        $this->command->info('Performance test data created successfully!');
        $this->command->info('Created 5 clients with programs, weeks, days, progress logs, and comments.');
        $this->command->info('Client emails: client1@liftnote.com to client5@liftnote.com');
        $this->command->info('Password for all clients: password123');
    }
} 