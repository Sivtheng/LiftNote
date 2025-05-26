<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'order' => 'required|integer|min:1'
            ]);

            $week = ProgramWeek::create([
                'program_id' => $program->id,
                'name' => $validated['name'],
                'order' => $validated['order']
            ]);

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
                'reps' => 'nullable|integer|min:1',
                'time_seconds' => 'nullable|integer|min:1',
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
                'reps' => $validated['reps'],
                'time_seconds' => $validated['time_seconds'],
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
                'reps' => $validated['reps'],
                'time_seconds' => $validated['time_seconds'],
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
} 