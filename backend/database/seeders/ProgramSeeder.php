<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Program;
use App\Models\User;

class ProgramSeeder extends Seeder
{
    public function run()
    {
        $coach = User::where('role', 'coach')->first();
        $clients = User::where('role', 'client')->get();

        $programs = [
            [
                'title' => 'Strength Building Program',
                'description' => 'A comprehensive program focused on building muscle mass and increasing overall strength.',
                'status' => 'active',
                'total_weeks' => 12,
                'completed_weeks' => 4
            ],
            [
                'title' => 'Weight Loss Journey',
                'description' => 'A balanced program combining cardio and strength training for effective weight loss.',
                'status' => 'active',
                'total_weeks' => 16,
                'completed_weeks' => 8
            ],
            [
                'title' => 'Marathon Training',
                'description' => 'Specialized program for marathon preparation with focus on endurance and stamina.',
                'status' => 'active',
                'total_weeks' => 20,
                'completed_weeks' => 12
            ],
            [
                'title' => 'Muscle Gain Program',
                'description' => 'Intensive program designed for maximum muscle growth and strength gains.',
                'status' => 'active',
                'total_weeks' => 8,
                'completed_weeks' => 2
            ],
            [
                'title' => 'Rehabilitation Program',
                'description' => 'Gentle exercises focused on recovery and rebuilding strength after injury.',
                'status' => 'active',
                'total_weeks' => 10,
                'completed_weeks' => 5
            ]
        ];

        foreach ($clients as $index => $client) {
            if (isset($programs[$index])) {
                Program::create([
                    'title' => $programs[$index]['title'],
                    'description' => $programs[$index]['description'],
                    'status' => $programs[$index]['status'],
                    'coach_id' => $coach->id,
                    'client_id' => $client->id,
                    'total_weeks' => $programs[$index]['total_weeks'],
                    'completed_weeks' => $programs[$index]['completed_weeks']
                ]);
            }
        }
    }
} 