<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        // User::create([
        //     'name' => 'admin',
        //     'email' => 'admin@liftnote.com',
        //     'password' => Hash::make('password'),
        //     'role' => 'admin',
        //     'phone_number' => '1234567890',
        //     'bio' => 'System Administrator',
        // ]);

        // Create Coach User
        User::create([
            'name' => 'coach',
            'email' => 'coach@liftnote.com',
            'password' => Hash::make('password'),
            'role' => 'coach',
            'phone_number' => '0987654321',
            'bio' => 'Professional Fitness Coach',
        ]);

        // Create default questionnaire questions
        \App\Models\QuestionnaireQuestion::create([
            'key' => 'fitness_goals',
            'question' => 'What are your primary fitness goals?',
            'type' => 'select',
            'options' => ['Weight Loss', 'Muscle Gain', 'Endurance', 'Strength', 'Flexibility'],
            'is_required' => true,
            'order' => 1
        ]);

        \App\Models\QuestionnaireQuestion::create([
            'key' => 'current_fitness_level',
            'question' => 'What is your current fitness level?',
            'type' => 'select',
            'options' => ['Beginner', 'Intermediate', 'Advanced'],
            'is_required' => true,
            'order' => 2
        ]);

        \App\Models\QuestionnaireQuestion::create([
            'key' => 'workout_frequency',
            'question' => 'How many times per week can you commit to working out?',
            'type' => 'number',
            'is_required' => true,
            'order' => 3
        ]);

        \App\Models\QuestionnaireQuestion::create([
            'key' => 'injuries_limitations',
            'question' => 'Do you have any injuries or physical limitations?',
            'type' => 'textarea',
            'is_required' => false,
            'order' => 4
        ]);

        \App\Models\QuestionnaireQuestion::create([
            'key' => 'preferred_workout_time',
            'question' => 'What is your preferred time to work out?',
            'type' => 'select',
            'options' => ['Morning', 'Afternoon', 'Evening'],
            'is_required' => true,
            'order' => 5
        ]);

        // $this->call([
        //     ClientSeeder::class,
        //     ProgramSeeder::class,
        //     CommentSeeder::class,
        //     ProgressLogSeeder::class,
        // ]);

        // Add performance test seeder
        $this->call([
            \Database\Seeders\PerformanceTestSeeder::class,
        ]);
    }
}
