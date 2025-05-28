<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProgressLog;
use App\Models\Program;
use App\Models\User;
use Carbon\Carbon;

class ProgressLogSeeder extends Seeder
{
    public function run(): void
    {
        // Get the marathon training program
        $program = Program::where('title', 'Marathon Training')->first();
        if (!$program) return;

        // Get the client (Mike Wilson)
        $client = User::where('email', 'mike.w@example.com')->first();
        if (!$client) return;

        // Get the first two weeks
        $weeks = $program->weeks()->take(2)->get();
        
        foreach ($weeks as $week) {
            foreach ($week->days as $day) {
                // Skip rest days
                if (str_contains(strtolower($day->name), 'rest')) {
                    continue;
                }

                $workoutStartTime = Carbon::now()
                    ->subDays(($week->order - 1) * 7 + $day->order - 1)
                    ->setHour(8)
                    ->setMinute(0)
                    ->setSecond(0);

                // Get exercises with their pivot data
                $exercises = $day->exercises()->withPivot([
                    'sets',
                    'reps',
                    'time_seconds',
                    'measurement_type',
                    'measurement_value'
                ])->get();

                foreach ($exercises as $exercise) {
                    // Get values from pivot table
                    $timeSeconds = $exercise->pivot->time_seconds;
                    $reps = $exercise->pivot->reps;
                    $rpe = $exercise->pivot->measurement_value;

                    // Add some variation to make it realistic
                    if ($timeSeconds) {
                        $timeSeconds = $timeSeconds + rand(-60, 60); // ±1 minute variation
                    }
                    if ($reps) {
                        $reps = $reps + rand(-2, 2); // ±2 reps variation
                    }
                    if ($rpe) {
                        $rpe = $rpe + rand(-1, 1); // ±1 RPE variation
                    }

                    // Calculate workout duration (time between first and last exercise)
                    $workoutDuration = $timeSeconds ? $timeSeconds + 300 : 600; // Add 5-10 minutes for rest between exercises

                    ProgressLog::create([
                        'program_id' => $program->id,
                        'user_id' => $client->id,
                        'exercise_id' => $exercise->id,
                        'week_id' => $week->id,
                        'day_id' => $day->id,
                        'weight' => null,
                        'reps' => $reps,
                        'time_seconds' => $timeSeconds,
                        'rpe' => $rpe,
                        'workout_duration' => $workoutDuration,
                        'completed_at' => $workoutStartTime->copy()->addMinutes(rand(0, 30)) // Random start time within 30 minutes
                    ]);
                }
            }
        }

        // Set current week and day to week 3, day 1
        $week3 = $program->weeks()->where('order', 3)->first();
        if ($week3) {
            $day1 = $week3->days()->where('order', 1)->first();
            if ($day1) {
                $program->update([
                    'current_week_id' => $week3->id,
                    'current_day_id' => $day1->id
                ]);
            }
        }
    }
} 