<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProgramBuilderController extends Controller
{
    public function addWeek(Request $request, Program $program)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Check if program has reached its total weeks limit
            $currentWeekCount = $program->weeks()->count();
            if ($currentWeekCount >= $program->total_weeks) {
                return response()->json([
                    'message' => 'Cannot add more weeks. Program has reached its maximum of ' . $program->total_weeks . ' weeks.',
                    'current_weeks' => $currentWeekCount,
                    'total_weeks' => $program->total_weeks
                ], 400);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'order' => 'required|integer|min:1'
            ]);

            $week = ProgramWeek::create([
                'program_id' => $program->id,
                'name' => $validated['name'],
                'order' => $validated['order']
            ]);

            // If the program was completed, reactivate it and set current week/day to the new week
            if ($program->status === 'completed') {
                $firstDay = $week->days()->orderBy('order')->first();
                $program->status = 'active';
                $program->current_week_id = $week->id;
                $program->current_day_id = $firstDay ? $firstDay->id : null;
                $program->save();
                // Reload relationships so getClientPrograms sees the new week/day as valid
                $program->load(['weeks.days']);
            }

            return response()->json([
                'message' => 'Week added successfully',
                'week' => $week->load('days')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error adding week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addDay(Request $request, $program, $week)
    {
        try {
            \Log::info('Adding day', [
                'program_id' => $program,
                'week_id' => $week,
                'request_data' => $request->all()
            ]);

            $program = Program::findOrFail($program);
            $week = ProgramWeek::where('id', $week)
                             ->where('program_id', $program->id)
                             ->firstOrFail();

            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                \Log::warning('Unauthorized attempt to add day', [
                    'user_id' => Auth::id(),
                    'program_id' => $program->id
                ]);
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'order' => 'required|integer|min:1'
            ]);

            $day = ProgramDay::create([
                'week_id' => $week->id,
                'name' => $validated['name'],
                'order' => $validated['order']
            ]);

            \Log::info('Day added successfully', ['day_id' => $day->id]);

            return response()->json([
                'message' => 'Day added successfully',
                'day' => $day->load('exercises')
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::error('Model not found while adding day', [
                'error' => $e->getMessage(),
                'program_id' => $program,
                'week_id' => $week
            ]);
            return response()->json([
                'message' => 'Program or week not found',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error adding day', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error adding day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addExercise(Request $request, Program $program, ProgramWeek $week, ProgramDay $day)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Verify day belongs to week
            if ($day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Day does not belong to this week'
                ], 400);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'sets' => 'required|integer|min:1',
                'reps' => 'required_if:time_seconds,null|nullable|integer|min:1',
                'time_seconds' => 'required_if:reps,null|nullable|integer|min:1',
                'measurement_type' => 'required|in:rpe,kg',
                'measurement_value' => 'required|numeric|min:0',
                'description' => 'nullable|string',
                'video_link' => 'nullable|url'
            ]);

            DB::beginTransaction();

            // Create or find exercise
            $exercise = Exercise::firstOrCreate(
                ['name' => $validated['name']],
                [
                    'description' => $validated['description'] ?? null,
                    'video_link' => $validated['video_link'] ?? null,
                    'created_by' => Auth::id()
                ]
            );

            // Attach exercise to day with pivot data
            $day->exercises()->attach($exercise->id, [
                'sets' => $validated['sets'],
                'reps' => $validated['reps'] ?? null,
                'time_seconds' => $validated['time_seconds'] ?? null,
                'measurement_type' => $validated['measurement_type'],
                'measurement_value' => $validated['measurement_value']
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Exercise added successfully',
                'exercise' => $exercise->load(['days' => function($query) use ($day) {
                    $query->where('program_days.id', $day->id);
                }])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error adding exercise', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error adding exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateWeek(Request $request, Program $program, ProgramWeek $week)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'order' => 'required|integer|min:1'
            ]);

            $week->update($validated);

            return response()->json([
                'message' => 'Week updated successfully',
                'week' => $week->load('days')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDay(Request $request, Program $program, ProgramWeek $week, ProgramDay $day)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Verify day belongs to week
            if ($day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Day does not belong to this week'
                ], 400);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'order' => 'required|integer|min:1'
            ]);

            $day->update($validated);

            return response()->json([
                'message' => 'Day updated successfully',
                'day' => $day->load('exercises')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteWeek($program, $week)
    {
        try {
            \Log::info('Deleting week', [
                'program_id' => $program,
                'week_id' => $week
            ]);

            $program = Program::findOrFail($program);
            $week = ProgramWeek::where('id', $week)
                             ->where('program_id', $program->id)
                             ->firstOrFail();

            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                \Log::warning('Unauthorized attempt to delete week', [
                    'user_id' => Auth::id(),
                    'program_id' => $program->id
                ]);
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            DB::beginTransaction();

            // Delete all exercises associated with days in this week
            foreach ($week->days as $day) {
                $day->exercises()->detach();
            }

            // Delete all days in this week
            $week->days()->delete();

            // Delete the week
            $week->delete();

            DB::commit();

            // Resequence week order after deletion
            $program->resequenceWeeks();

            \Log::info('Week deleted successfully', ['week_id' => $week->id]);

            return response()->json([
                'message' => 'Week deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::error('Model not found while deleting week', [
                'error' => $e->getMessage(),
                'program_id' => $program,
                'week_id' => $week
            ]);
            return response()->json([
                'message' => 'Program or week not found',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting week', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error deleting week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteDay($program, $week, $day)
    {
        try {
            $program = Program::findOrFail($program);
            $week = ProgramWeek::findOrFail($week);
            $day = ProgramDay::findOrFail($day);

            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Verify day belongs to week
            if ($day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Day does not belong to this week'
                ], 400);
            }

            DB::beginTransaction();

            // Delete all exercises associated with this day
            $day->exercises()->detach();

            // Delete the day
            $day->delete();

            DB::commit();

            return response()->json([
                'message' => 'Day deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error deleting day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function removeExercise(Program $program, ProgramWeek $week, ProgramDay $day, Exercise $exercise)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Verify day belongs to week
            if ($day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Day does not belong to this week'
                ], 400);
            }

            $day->exercises()->detach($exercise->id);

            return response()->json([
                'message' => 'Exercise removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error removing exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateExercise(Request $request, Program $program, ProgramWeek $week, ProgramDay $day, Exercise $exercise)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Verify day belongs to week
            if ($day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Day does not belong to this week'
                ], 400);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'sets' => 'required|integer|min:1',
                'reps' => 'nullable|integer|min:1',
                'time_seconds' => 'nullable|integer|min:1',
                'measurement_type' => 'required|in:rpe,kg',
                'measurement_value' => 'required|numeric|min:0',
                'description' => 'nullable|string',
                'video_link' => 'nullable|url'
            ]);

            DB::beginTransaction();

            // Update exercise details
            $exercise->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'video_link' => $validated['video_link'] ?? null
            ]);

            // Update pivot data
            $day->exercises()->updateExistingPivot($exercise->id, [
                'sets' => $validated['sets'],
                'reps' => $validated['reps'] ?? null,
                'time_seconds' => $validated['time_seconds'] ?? null,
                'measurement_type' => $validated['measurement_type'],
                'measurement_value' => $validated['measurement_value']
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Exercise updated successfully',
                'exercise' => $exercise->load(['days' => function($query) use ($day) {
                    $query->where('program_days.id', $day->id);
                }])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating exercise', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error updating exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteExercise(Program $program, ProgramWeek $week, ProgramDay $day, Exercise $exercise)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Verify day belongs to week
            if ($day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Day does not belong to this week'
                ], 400);
            }

            DB::beginTransaction();

            // Detach the exercise from the day
            $day->exercises()->detach($exercise->id);

            DB::commit();

            return response()->json([
                'message' => 'Exercise deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting exercise', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error deleting exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function duplicateWeek(Request $request, $programId, $weekId)
    {
        try {
            $program = Program::findOrFail($programId);
            
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $week = ProgramWeek::where('program_id', $programId)
                ->where('id', $weekId)
                ->with(['days' => function($query) {
                    $query->with(['exercises' => function($query) {
                        $query->withPivot(['sets', 'reps', 'time_seconds', 'measurement_type', 'measurement_value']);
                    }]);
                }])
                ->firstOrFail();

            DB::beginTransaction();

            // Create a new week
            $newWeek = $week->replicate();
            $newWeek->name = $week->name . ' (Copy)';
            $newWeek->order = ProgramWeek::where('program_id', $programId)->max('order') + 1;
            $newWeek->save();

            // Duplicate all days and their exercises
            foreach ($week->days as $day) {
                $newDay = $day->replicate();
                $newDay->week_id = $newWeek->id;
                $newDay->order = ProgramDay::where('week_id', $newWeek->id)->max('order') + 1;
                $newDay->save();

                // Duplicate all exercises for this day
                foreach ($day->exercises as $exercise) {
                    $pivotData = [
                        'sets' => $exercise->pivot->sets,
                        'reps' => $exercise->pivot->reps,
                        'time_seconds' => $exercise->pivot->time_seconds,
                        'measurement_type' => $exercise->pivot->measurement_type,
                        'measurement_value' => $exercise->pivot->measurement_value
                    ];
                    $newDay->exercises()->attach($exercise->id, $pivotData);
                }
            }

            DB::commit();

            // Resequence week order after duplication
            $program->resequenceWeeks();

            // Load the relationships for the response
            $newWeek->load(['days' => function($query) {
                $query->with(['exercises' => function($query) {
                    $query->withPivot(['sets', 'reps', 'time_seconds', 'measurement_type', 'measurement_value']);
                }]);
            }]);

            return response()->json([
                'message' => 'Week duplicated successfully',
                'week' => $newWeek
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error duplicating week: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to duplicate week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function duplicateDay(Request $request, Program $program, ProgramWeek $week, ProgramDay $day)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Verify week and day belong to program
            if ($week->program_id !== $program->id || $day->week_id !== $week->id) {
                return response()->json([
                    'message' => 'Week or day does not belong to this program'
                ], 400);
            }

            DB::beginTransaction();

            // Create a new day
            $newDay = $day->replicate();
            $newDay->name = $day->name . ' (Copy)';
            $newDay->order = ProgramDay::where('week_id', $week->id)->max('order') + 1;
            $newDay->save();

            // Duplicate all exercises for this day
            foreach ($day->exercises as $exercise) {
                $pivotData = [
                    'sets' => $exercise->pivot->sets,
                    'reps' => $exercise->pivot->reps,
                    'time_seconds' => $exercise->pivot->time_seconds,
                    'measurement_type' => $exercise->pivot->measurement_type,
                    'measurement_value' => $exercise->pivot->measurement_value
                ];
                $newDay->exercises()->attach($exercise->id, $pivotData);
            }

            DB::commit();

            // Load the relationships for the response
            $newDay->load(['exercises' => function($query) {
                $query->withPivot(['sets', 'reps', 'time_seconds', 'measurement_type', 'measurement_value']);
            }]);

            return response()->json([
                'message' => 'Day duplicated successfully',
                'day' => $newDay
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error duplicating day: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to duplicate day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateTotalWeeks(Request $request, Program $program)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'total_weeks' => 'required|integer|min:1|max:52'
            ]);

            // Check if new total_weeks is less than current week count
            $currentWeekCount = $program->weeks()->count();
            if ($validated['total_weeks'] < $currentWeekCount) {
                return response()->json([
                    'message' => 'Cannot reduce total weeks below current week count (' . $currentWeekCount . ' weeks)',
                    'current_weeks' => $currentWeekCount,
                    'requested_total_weeks' => $validated['total_weeks']
                ], 400);
            }

            $program->update([
                'total_weeks' => $validated['total_weeks']
            ]);

            return response()->json([
                'message' => 'Total weeks updated successfully',
                'program' => $program->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating total weeks',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 