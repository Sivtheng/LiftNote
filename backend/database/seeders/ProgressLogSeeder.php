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
        $program = Program::where('title', 'Marathon Training Program')->first();
        if (!$program) return;

        // Get the client (Mike Wilson)
        $client = User::where('name', 'Mike Wilson')->first();
        if (!$client) return;

        // Get the first two weeks
        $weeks = $program->weeks()->take(2)->get();
        
        foreach ($weeks as $week) {
            foreach ($week->days as $day) {
                foreach ($day->exercises as $exercise) {
                    // Create 3 sets of progress logs for each exercise
                    for ($set = 1; $set <= 3; $set++) {
                        $weight = null;
                        $reps = null;
                        $timeSeconds = null;
                        $rpe = null;

                        // Set values based on exercise type
                        switch ($exercise->measurement_type) {
                            case 'kg':
                                $weight = $exercise->measurement_value;
                                $reps = $exercise->reps;
                                break;
                            case 'time':
                                $timeSeconds = $exercise->time_seconds;
                                break;
                            case 'rpe':
                                $rpe = $exercise->measurement_value;
                                $reps = $exercise->reps;
                                break;
                        }

                        // Create progress log
                        ProgressLog::create([
                            'program_id' => $program->id,
                            'user_id' => $client->id,
                            'exercise_id' => $exercise->id,
                            'week_id' => $week->id,
                            'day_id' => $day->id,
                            'weight' => $weight,
                            'reps' => $reps,
                            'time_seconds' => $timeSeconds,
                            'rpe' => $rpe,
                            'completed_at' => Carbon::now()->subDays(($week->id - 1) * 7 + $day->id - 1),
                        ]);
                    }
                }
            }
        }
    }
} 