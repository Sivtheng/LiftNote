<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Program;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use App\Models\ProgressLog;
use App\Models\Comment;
use App\Models\Exercise;
use App\Models\Questionnaire;
use App\Models\QuestionnaireQuestion;
use Illuminate\Support\Facades\Hash;

class PerformanceTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the existing coach from DatabaseSeeder
        $coach = User::where('email', 'coach@liftnote.com')->first();
        if (!$coach) {
            $this->command->error('No coach found. Please run DatabaseSeeder first.');
            return;
        }

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

        // Create exercises for the system (using only existing columns)
        $exercises = [];
        $exerciseNames = [
            'Bench Press', 'Squat', 'Deadlift', 'Pull-ups', 'Push-ups',
            'Lunges', 'Planks', 'Burpees', 'Mountain Climbers', 'Jumping Jacks'
        ];

        foreach ($exerciseNames as $index => $name) {
            $exercises[] = Exercise::updateOrCreate(
                ['name' => $name],
                [
                    'description' => "Test exercise: {$name} - A comprehensive workout movement for strength training.",
                    'target_type' => $index % 2 == 0 ? 'reps' : 'time',
                    'video_link' => null,
                    'created_by' => $coach->id,
                ]
            );
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

            // Create multiple weeks for the program
            for ($weekNum = 1; $weekNum <= 3; $weekNum++) {
                $week = ProgramWeek::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'order' => $weekNum
                    ],
                    [
                        'name' => "Week {$weekNum}",
                    ]
                );

                // Create multiple days for each week
                for ($dayNum = 1; $dayNum <= 5; $dayNum++) {
                    $day = ProgramDay::updateOrCreate(
                        [
                            'week_id' => $week->id,
                            'order' => $dayNum
                        ],
                        [
                            'name' => "Day {$dayNum}",
                        ]
                    );
                }

                // Set current week and day for the program
                if ($weekNum === 1) {
                    $program->update([
                        'current_week_id' => $week->id,
                        'current_day_id' => $week->programDays->first()->id
                    ]);
                }
            }

            // Add multiple progress logs
            for ($j = 1; $j <= 5; $j++) {
                $randomExercise = $exercises[array_rand($exercises)];
                $randomWeek = $program->programWeeks->random();
                $randomDay = $randomWeek->programDays->random();

                ProgressLog::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'user_id' => $client->id,
                        'completed_at' => now()->subDays($j * 2)
                    ],
                    [
                        'exercise_id' => $randomExercise->id,
                        'week_id' => $randomWeek->id,
                        'day_id' => $randomDay->id,
                        'weight' => rand(50, 200),
                        'reps' => rand(8, 15),
                        'sets' => rand(3, 5),
                        'time_seconds' => rand(1800, 3600), // 30-60 minutes
                        'rpe' => rand(6, 9),
                        'workout_duration' => rand(1800, 3600),
                        'is_rest_day' => false,
                        'notes' => "Test progress log {$j} for Client {$i}",
                    ]
                );
            }

            // Add multiple comments (from both client and coach)
            for ($k = 1; $k <= 3; $k++) {
                // Client comment
                Comment::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'user_id' => $client->id,
                        'content' => "Client {$i} comment {$k}: Great workout today!"
                    ],
                    [
                        'media_type' => null,
                        'media_url' => null,
                        'parent_id' => null,
                    ]
                );

                // Coach comment
                Comment::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'user_id' => $coach->id,
                        'content' => "Coach comment {$k}: Keep up the good work, Client {$i}!"
                    ],
                    [
                        'media_type' => null,
                        'media_url' => null,
                        'parent_id' => null,
                    ]
                );
            }

            // Create questionnaire for the client
            Questionnaire::updateOrCreate(
                [
                    'user_id' => $client->id
                ],
                [
                    'status' => 'completed',
                    'completed_at' => now()->subDays(rand(1, 30)),
                ]
            );
        }

        // Create additional exercises for variety
        $additionalExercises = [
            'Overhead Press', 'Bent Over Rows', 'Leg Press', 'Lat Pulldowns',
            'Bicep Curls', 'Tricep Dips', 'Shoulder Press', 'Calf Raises'
        ];

        foreach ($additionalExercises as $name) {
            Exercise::updateOrCreate(
                ['name' => $name],
                [
                    'description' => "Additional test exercise: {$name} - A great movement for building strength and muscle.",
                    'target_type' => 'reps',
                    'video_link' => null,
                    'created_by' => $coach->id,
                ]
            );
        }

        $this->command->info('Performance test data created successfully!');
        $this->command->info('Created:');
        $this->command->info('- Using existing coach: coach@liftnote.com');
        $this->command->info('- 5 clients: client1@liftnote.com to client5@liftnote.com');
        $this->command->info('- 18 exercises');
        $this->command->info('- Using existing questionnaire questions (from DatabaseSeeder)');
        $this->command->info('- 5 programs with weeks, days, progress logs, and comments');
        $this->command->info('- 5 questionnaires');
        $this->command->info('Coach password: password (from DatabaseSeeder)');
        $this->command->info('Client passwords: password123');
    }
} 