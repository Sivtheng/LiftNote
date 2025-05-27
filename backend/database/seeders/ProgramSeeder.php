<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Program;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use App\Models\User;
use App\Models\Exercise;

class ProgramSeeder extends Seeder
{
    public function run()
    {
        $coach = User::where('role', 'coach')->first();
        $clients = User::where('role', 'client')->take(3)->get();

        $programs = [
            [
                'title' => 'Strength Building Program',
                'description' => 'A comprehensive program focused on building muscle mass and increasing overall strength.',
                'status' => 'active',
                'total_weeks' => 8,
                'completed_weeks' => 2,
                'weeks' => [
                    [
                        'name' => 'Week 1: Foundation',
                        'days' => [
                            ['name' => 'Day 1: Upper Body', 'exercises' => [
                                ['name' => 'Bench Press', 'sets' => 4, 'reps' => 8, 'measurement_type' => 'kg', 'measurement_value' => 60],
                                ['name' => 'Pull-ups', 'sets' => 3, 'reps' => 10, 'measurement_type' => 'rpe', 'measurement_value' => 7],
                                ['name' => 'Shoulder Press', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 40]
                            ]],
                            ['name' => 'Day 2: Lower Body', 'exercises' => [
                                ['name' => 'Squats', 'sets' => 4, 'reps' => 8, 'measurement_type' => 'kg', 'measurement_value' => 80],
                                ['name' => 'Romanian Deadlifts', 'sets' => 3, 'reps' => 10, 'measurement_type' => 'kg', 'measurement_value' => 70],
                                ['name' => 'Leg Press', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 100]
                            ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                            ['name' => 'Day 4: Full Body', 'exercises' => [
                                ['name' => 'Deadlifts', 'sets' => 4, 'reps' => 6, 'measurement_type' => 'kg', 'measurement_value' => 100],
                                ['name' => 'Push-ups', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 7],
                                ['name' => 'Plank', 'sets' => 3, 'time_seconds' => 60, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                            ]]
                        ]
                    ],
                    [
                        'name' => 'Week 2: Progression',
                        'days' => [
                            ['name' => 'Day 1: Upper Body', 'exercises' => [
                                ['name' => 'Bench Press', 'sets' => 4, 'reps' => 8, 'measurement_type' => 'kg', 'measurement_value' => 65],
                                ['name' => 'Pull-ups', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'rpe', 'measurement_value' => 7],
                                ['name' => 'Shoulder Press', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 45]
                            ]],
                            ['name' => 'Day 2: Lower Body', 'exercises' => [
                                ['name' => 'Squats', 'sets' => 4, 'reps' => 8, 'measurement_type' => 'kg', 'measurement_value' => 85],
                                ['name' => 'Romanian Deadlifts', 'sets' => 3, 'reps' => 10, 'measurement_type' => 'kg', 'measurement_value' => 75],
                                ['name' => 'Leg Press', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 110]
                            ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                            ['name' => 'Day 4: Full Body', 'exercises' => [
                                ['name' => 'Deadlifts', 'sets' => 4, 'reps' => 6, 'measurement_type' => 'kg', 'measurement_value' => 105],
                                ['name' => 'Push-ups', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 7],
                                ['name' => 'Plank', 'sets' => 3, 'time_seconds' => 60, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                            ]]
                        ]
                    ]
                ]
            ],
            [
                'title' => 'Weight Loss Journey',
                'description' => 'A balanced program combining cardio and strength training for effective weight loss.',
                'status' => 'active',
                'total_weeks' => 12,
                'completed_weeks' => 4,
                'weeks' => [
                    [
                        'name' => 'Week 1: Cardio Focus',
                        'days' => [
                            ['name' => 'Day 1: HIIT', 'exercises' => [
                                ['name' => 'Burpees', 'sets' => 4, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 8],
                                ['name' => 'Mountain Climbers', 'sets' => 3, 'time_seconds' => 45, 'measurement_type' => 'rpe', 'measurement_value' => 7],
                                ['name' => 'Jump Rope', 'sets' => 3, 'time_seconds' => 60, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                            ]],
                            ['name' => 'Day 2: Strength', 'exercises' => [
                                ['name' => 'Goblet Squats', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'kg', 'measurement_value' => 20],
                                ['name' => 'Dumbbell Rows', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 15],
                                ['name' => 'Push-ups', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                            ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                            ['name' => 'Day 4: Cardio', 'exercises' => [
                                ['name' => 'Running', 'sets' => 1, 'time_seconds' => 1800, 'measurement_type' => 'rpe', 'measurement_value' => 6],
                                ['name' => 'Cycling', 'sets' => 1, 'time_seconds' => 1200, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                            ]]
                        ]
                    ],
                    [
                        'name' => 'Week 2: Strength Focus',
                        'days' => [
                            ['name' => 'Day 1: Upper Body', 'exercises' => [
                                ['name' => 'Dumbbell Press', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 15],
                                ['name' => 'Lat Pulldowns', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 40],
                                ['name' => 'Tricep Dips', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                            ]],
                            ['name' => 'Day 2: Lower Body', 'exercises' => [
                                ['name' => 'Lunges', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'kg', 'measurement_value' => 15],
                                ['name' => 'Leg Press', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'kg', 'measurement_value' => 60],
                                ['name' => 'Calf Raises', 'sets' => 3, 'reps' => 20, 'measurement_type' => 'kg', 'measurement_value' => 30]
                            ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                            ['name' => 'Day 4: Cardio', 'exercises' => [
                                ['name' => 'Rowing', 'sets' => 3, 'time_seconds' => 600, 'measurement_type' => 'rpe', 'measurement_value' => 7],
                                ['name' => 'Jump Rope', 'sets' => 3, 'time_seconds' => 300, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                            ]]
                        ]
                    ]
                ]
            ],
            [
                'title' => 'Marathon Training',
                'description' => 'Specialized program for marathon preparation with focus on endurance and stamina.',
                'status' => 'active',
                'total_weeks' => 16,
                'completed_weeks' => 6,
                'weeks' => [
                    [
                        'name' => 'Week 1: Base Building',
                        'days' => [
                            ['name' => 'Day 1: Easy Run', 'exercises' => [
                                ['name' => 'Easy Pace Run', 'sets' => 1, 'time_seconds' => 1800, 'measurement_type' => 'rpe', 'measurement_value' => 4]
                            ]],
                            ['name' => 'Day 2: Cross Training', 'exercises' => [
                                ['name' => 'Cycling', 'sets' => 1, 'time_seconds' => 2400, 'measurement_type' => 'rpe', 'measurement_value' => 5],
                                ['name' => 'Core Workout', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                            ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                            ['name' => 'Day 4: Tempo Run', 'exercises' => [
                                ['name' => 'Tempo Run', 'sets' => 1, 'time_seconds' => 2400, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                            ]]
                        ]
                    ],
                    [
                        'name' => 'Week 2: Endurance',
                        'days' => [
                            ['name' => 'Day 1: Long Run', 'exercises' => [
                                ['name' => 'Long Distance Run', 'sets' => 1, 'time_seconds' => 3600, 'measurement_type' => 'rpe', 'measurement_value' => 5]
                            ]],
                            ['name' => 'Day 2: Recovery', 'exercises' => [
                                ['name' => 'Easy Jog', 'sets' => 1, 'time_seconds' => 1200, 'measurement_type' => 'rpe', 'measurement_value' => 3],
                                ['name' => 'Stretching', 'sets' => 1, 'time_seconds' => 900, 'measurement_type' => 'rpe', 'measurement_value' => 4]
                            ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                            ['name' => 'Day 4: Speed Work', 'exercises' => [
                                ['name' => 'Interval Training', 'sets' => 8, 'time_seconds' => 200, 'measurement_type' => 'rpe', 'measurement_value' => 8],
                                ['name' => 'Recovery Jog', 'sets' => 8, 'time_seconds' => 200, 'measurement_type' => 'rpe', 'measurement_value' => 3]
                            ]]
                        ]
                    ]
                ]
            ]
        ];

        foreach ($clients as $index => $client) {
            if (isset($programs[$index])) {
                $program = Program::create([
                    'title' => $programs[$index]['title'],
                    'description' => $programs[$index]['description'],
                    'status' => $programs[$index]['status'],
                    'coach_id' => $coach->id,
                    'client_id' => $client->id,
                    'total_weeks' => $programs[$index]['total_weeks'],
                    'completed_weeks' => $programs[$index]['completed_weeks']
                ]);

                // Create weeks and days
                foreach ($programs[$index]['weeks'] as $weekIndex => $weekData) {
                    $week = ProgramWeek::create([
                        'program_id' => $program->id,
                        'name' => $weekData['name'],
                        'order' => $weekIndex + 1
                    ]);

                    foreach ($weekData['days'] as $dayIndex => $dayData) {
                        $day = ProgramDay::create([
                            'week_id' => $week->id,
                            'name' => $dayData['name'],
                            'order' => $dayIndex + 1
                        ]);

                        // Create and attach exercises
                        foreach ($dayData['exercises'] as $exerciseData) {
                            $exercise = Exercise::firstOrCreate(
                                ['name' => $exerciseData['name']],
                                [
                                    'description' => null,
                                    'video_link' => null,
                                    'created_by' => $coach->id
                                ]
                            );

                            $day->exercises()->attach($exercise->id, [
                                'sets' => $exerciseData['sets'],
                                'reps' => $exerciseData['reps'] ?? null,
                                'time_seconds' => $exerciseData['time_seconds'] ?? null,
                                'measurement_type' => $exerciseData['measurement_type'],
                                'measurement_value' => $exerciseData['measurement_value']
                            ]);
                        }
                    }
                }
            }
        }
    }
} 