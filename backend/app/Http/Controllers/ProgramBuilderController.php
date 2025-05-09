<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProgramBuilderController extends Controller
{
    public function addWeek(Request $request, Program $program)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255'
            ]);

            $week = ProgramWeek::create([
                'program_id' => $program->id,
                'name' => $validated['name'],
                'order' => $program->weeks()->count() + 1
            ]);

            return response()->json([
                'message' => 'Week added successfully',
                'week' => $week
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error adding week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addDay(Request $request, ProgramWeek $week)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255'
            ]);

            $day = ProgramDay::create([
                'week_id' => $week->id,
                'name' => $validated['name'],
                'order' => $week->days()->count() + 1
            ]);

            return response()->json([
                'message' => 'Day added successfully',
                'day' => $day
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error adding day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addExercise(Request $request, ProgramDay $day)
    {
        try {
            $validated = $request->validate([
                'exercise_id' => 'required|exists:exercises,id',
                'target_types' => 'required|array',
                'values' => 'required|array'
            ]);

            $day->exercises()->attach($validated['exercise_id'], [
                'target_types' => $validated['target_types'],
                'values' => $validated['values']
            ]);

            return response()->json([
                'message' => 'Exercise added successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error adding exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateWeek(Request $request, ProgramWeek $week)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255'
            ]);

            $week->update($validated);

            return response()->json([
                'message' => 'Week updated successfully',
                'week' => $week
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDay(Request $request, ProgramDay $day)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255'
            ]);

            $day->update($validated);

            return response()->json([
                'message' => 'Day updated successfully',
                'day' => $day
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteWeek(ProgramWeek $week)
    {
        try {
            $week->delete();
            return response()->json(['message' => 'Week deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting week',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteDay(ProgramDay $day)
    {
        try {
            $day->delete();
            return response()->json(['message' => 'Day deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting day',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function removeExercise(ProgramDay $day, Exercise $exercise)
    {
        try {
            $day->exercises()->detach($exercise->id);
            return response()->json(['message' => 'Exercise removed successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error removing exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 