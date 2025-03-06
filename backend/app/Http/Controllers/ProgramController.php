<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProgramController extends Controller
{
    // Create a new program for a client (Coach/Admin only)
    public function create(Request $request, User $client)
    {
        try {
            // Verify the target user is a client
            if (!$client->isClient()) {
                return response()->json(['message' => 'Target user is not a client'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:active,completed,cancelled'
            ]);

            // Create program
            $program = Program::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'status' => $validated['status'],
                'coach_id' => Auth::id(),
                'client_id' => $client->id
            ]);

            return response()->json([
                'message' => 'Program created successfully',
                'program' => $program->load(['coach', 'client'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update an existing program (Coach/Admin only)
    public function update(Request $request, Program $program)
    {
        try {
            // Verify the coach owns this program
            if ($program->coach_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'status' => 'sometimes|in:active,completed,cancelled'
            ]);

            // Update program
            $program->update($validated);

            return response()->json([
                'message' => 'Program updated successfully',
                'program' => $program->fresh(['coach', 'client'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get all programs for authenticated coach
    public function getCoachPrograms()
    {
        try {
            $programs = Auth::user()
                ->programs()
                ->with(['client' => function($query) {
                    $query->with('questionnaire');
                }])
                ->get();

            return response()->json($programs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching programs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get all programs for authenticated client
    public function getClientPrograms()
    {
        try {
            $programs = Program::where('client_id', Auth::id())
                ->with(['coach', 'progressLogs'])
                ->get();

            return response()->json($programs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching programs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get specific program details
    public function show(Program $program)
    {
        try {
            // Verify user has access to this program
            $user = Auth::user();
            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $program->load(['coach', 'client', 'progressLogs']);

            return response()->json($program);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a program (Coach/Admin only)
    public function delete(Program $program)
    {
        try {
            // Verify the coach owns this program
            if ($program->coach_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $program->delete();

            return response()->json([
                'message' => 'Program deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting program',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
