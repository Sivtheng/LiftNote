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
        $client = User::where('email', 'mike.w@example.com')->first();

        $program = Program::create([
                'title' => 'Marathon Training',
                'description' => 'Specialized program for marathon preparation with focus on endurance and stamina.',
                'status' => 'active',
            'coach_id' => $coach->id,
            'client_id' => $client->id,
            'total_weeks' => 4,
            'completed_weeks' => 2
        ]);

        $weeks = [
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
                    ]],
                    ['name' => 'Day 5: Long Run', 'exercises' => [
                        ['name' => 'Long Distance Run', 'sets' => 1, 'time_seconds' => 3600, 'measurement_type' => 'rpe', 'measurement_value' => 5]
                    ]],
                    ['name' => 'Day 6: Recovery', 'exercises' => [
                        ['name' => 'Easy Jog', 'sets' => 1, 'time_seconds' => 1200, 'measurement_type' => 'rpe', 'measurement_value' => 3],
                        ['name' => 'Stretching', 'sets' => 1, 'time_seconds' => 900, 'measurement_type' => 'rpe', 'measurement_value' => 4]
                    ]],
                    ['name' => 'Day 7: Rest', 'exercises' => []]
                        ]
                    ],
                    [
                        'name' => 'Week 2: Endurance',
                        'days' => [
                    ['name' => 'Day 1: Speed Work', 'exercises' => [
                        ['name' => 'Interval Training', 'sets' => 8, 'time_seconds' => 200, 'measurement_type' => 'rpe', 'measurement_value' => 8],
                        ['name' => 'Recovery Jog', 'sets' => 8, 'time_seconds' => 200, 'measurement_type' => 'rpe', 'measurement_value' => 3]
                    ]],
                    ['name' => 'Day 2: Strength Training', 'exercises' => [
                        ['name' => 'Bodyweight Squats', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 6],
                        ['name' => 'Lunges', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'rpe', 'measurement_value' => 6],
                        ['name' => 'Plank', 'sets' => 3, 'time_seconds' => 60, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                    ]],
                    ['name' => 'Day 3: Rest', 'exercises' => []],
                    ['name' => 'Day 4: Hill Training', 'exercises' => [
                        ['name' => 'Hill Repeats', 'sets' => 6, 'time_seconds' => 300, 'measurement_type' => 'rpe', 'measurement_value' => 8],
                        ['name' => 'Recovery Jog', 'sets' => 6, 'time_seconds' => 300, 'measurement_type' => 'rpe', 'measurement_value' => 3]
                    ]],
                    ['name' => 'Day 5: Long Run', 'exercises' => [
                        ['name' => 'Long Distance Run', 'sets' => 1, 'time_seconds' => 4200, 'measurement_type' => 'rpe', 'measurement_value' => 5]
                    ]],
                    ['name' => 'Day 6: Recovery', 'exercises' => [
                        ['name' => 'Easy Jog', 'sets' => 1, 'time_seconds' => 1500, 'measurement_type' => 'rpe', 'measurement_value' => 3],
                                ['name' => 'Stretching', 'sets' => 1, 'time_seconds' => 900, 'measurement_type' => 'rpe', 'measurement_value' => 4]
                            ]],
                    ['name' => 'Day 7: Rest', 'exercises' => []]
                ]
            ],
            [
                'name' => 'Week 3: Speed Development',
                'days' => [
                    ['name' => 'Day 1: Fartlek Training', 'exercises' => [
                        ['name' => 'Fartlek Run', 'sets' => 1, 'time_seconds' => 3000, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                    ]],
                    ['name' => 'Day 2: Cross Training', 'exercises' => [
                        ['name' => 'Swimming', 'sets' => 1, 'time_seconds' => 2400, 'measurement_type' => 'rpe', 'measurement_value' => 5],
                        ['name' => 'Core Workout', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                    ]],
                            ['name' => 'Day 3: Rest', 'exercises' => []],
                    ['name' => 'Day 4: Tempo Run', 'exercises' => [
                        ['name' => 'Tempo Run', 'sets' => 1, 'time_seconds' => 3000, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                    ]],
                    ['name' => 'Day 5: Long Run', 'exercises' => [
                        ['name' => 'Long Distance Run', 'sets' => 1, 'time_seconds' => 4800, 'measurement_type' => 'rpe', 'measurement_value' => 5]
                    ]],
                    ['name' => 'Day 6: Recovery', 'exercises' => [
                        ['name' => 'Easy Jog', 'sets' => 1, 'time_seconds' => 1800, 'measurement_type' => 'rpe', 'measurement_value' => 3],
                        ['name' => 'Stretching', 'sets' => 1, 'time_seconds' => 900, 'measurement_type' => 'rpe', 'measurement_value' => 4]
                    ]],
                    ['name' => 'Day 7: Rest', 'exercises' => []]
                ]
            ],
            [
                'name' => 'Week 4: Race Preparation',
                'days' => [
                    ['name' => 'Day 1: Speed Work', 'exercises' => [
                        ['name' => 'Interval Training', 'sets' => 10, 'time_seconds' => 200, 'measurement_type' => 'rpe', 'measurement_value' => 8],
                        ['name' => 'Recovery Jog', 'sets' => 10, 'time_seconds' => 200, 'measurement_type' => 'rpe', 'measurement_value' => 3]
                    ]],
                    ['name' => 'Day 2: Strength Training', 'exercises' => [
                        ['name' => 'Bodyweight Squats', 'sets' => 3, 'reps' => 15, 'measurement_type' => 'rpe', 'measurement_value' => 6],
                        ['name' => 'Lunges', 'sets' => 3, 'reps' => 12, 'measurement_type' => 'rpe', 'measurement_value' => 6],
                        ['name' => 'Plank', 'sets' => 3, 'time_seconds' => 60, 'measurement_type' => 'rpe', 'measurement_value' => 6]
                    ]],
                    ['name' => 'Day 3: Rest', 'exercises' => []],
                    ['name' => 'Day 4: Race Pace', 'exercises' => [
                        ['name' => 'Race Pace Run', 'sets' => 1, 'time_seconds' => 3600, 'measurement_type' => 'rpe', 'measurement_value' => 7]
                    ]],
                    ['name' => 'Day 5: Long Run', 'exercises' => [
                        ['name' => 'Long Distance Run', 'sets' => 1, 'time_seconds' => 5400, 'measurement_type' => 'rpe', 'measurement_value' => 5]
                    ]],
                    ['name' => 'Day 6: Recovery', 'exercises' => [
                        ['name' => 'Easy Jog', 'sets' => 1, 'time_seconds' => 1800, 'measurement_type' => 'rpe', 'measurement_value' => 3],
                        ['name' => 'Stretching', 'sets' => 1, 'time_seconds' => 900, 'measurement_type' => 'rpe', 'measurement_value' => 4]
                    ]],
                    ['name' => 'Day 7: Rest', 'exercises' => []]
                ]
            ]
        ];

        foreach ($weeks as $weekIndex => $weekData) {
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

        // Set initial current week and day
        $firstWeek = $program->weeks()->orderBy('order')->first();
        if ($firstWeek) {
            $firstDay = $firstWeek->days()->orderBy('order')->first();
            if ($firstDay) {
                $program->update([
                    'current_week_id' => $firstWeek->id,
                    'current_day_id' => $firstDay->id
                ]);
            }
        }
    }
} 