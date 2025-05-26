<?php

namespace App\Http\Controllers;

use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExerciseController extends Controller
{
    public function index()
    {
        try {
            $exercises = Exercise::with('creator')->get();
            return response()->json(['exercises' => $exercises]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching exercises',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'target_type' => 'required|in:reps,time',
                'description' => 'nullable|string',
                'video_link' => 'nullable|url'
            ]);

            $exercise = Exercise::create([
                'name' => $validated['name'],
                'target_type' => $validated['target_type'],
                'description' => $validated['description'],
                'video_link' => $validated['video_link'],
                'created_by' => Auth::id()
            ]);

            return response()->json([
                'message' => 'Exercise created successfully',
                'exercise' => $exercise
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Exercise $exercise)
    {
        try {
            return response()->json(['exercise' => $exercise->load('creator')]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Exercise $exercise)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'target_type' => 'required|in:reps,time',
                'description' => 'nullable|string',
                'video_link' => 'nullable|url'
            ]);

            $exercise->update($validated);

            return response()->json([
                'message' => 'Exercise updated successfully',
                'exercise' => $exercise
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Exercise $exercise)
    {
        try {
            $exercise->delete();
            return response()->json(['message' => 'Exercise deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting exercise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->get('query');
            $exercises = Exercise::where('name', 'like', "%{$query}%")
                ->with('creator')
                ->get();
            return response()->json(['exercises' => $exercises]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error searching exercises',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 