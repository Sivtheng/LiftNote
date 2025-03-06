<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgressLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProgressLogController extends Controller
{
    // Create a progress log (Client only)
    public function create(Request $request, Program $program)
    {
        try {
            // Verify this is the client's program
            if ($program->client_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'date' => 'required|date'
            ]);

            // Create progress log
            $progressLog = ProgressLog::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'client_id' => Auth::id(),
                'program_id' => $program->id
            ]);

            return response()->json([
                'message' => 'Progress log created successfully',
                'progress_log' => $progressLog->load(['client', 'program'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating progress log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update a progress log (Client only)
    public function update(Request $request, ProgressLog $progressLog)
    {
        try {
            // Verify ownership
            if ($progressLog->client_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'date' => 'sometimes|date'
            ]);

            // Update progress log
            $progressLog->update($validated);

            return response()->json([
                'message' => 'Progress log updated successfully',
                'progress_log' => $progressLog->fresh(['client', 'program'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating progress log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get all progress logs for a program
    public function getProgramLogs(Program $program)
    {
        try {
            // Verify access rights
            $user = Auth::user();
            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $logs = $program->progressLogs()
                ->with(['client'])
                ->orderBy('date', 'desc')
                ->get();

            return response()->json($logs);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching progress logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get specific progress log
    public function show(ProgressLog $progressLog)
    {
        try {
            // Verify access rights
            $user = Auth::user();
            $program = $progressLog->program;

            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $progressLog->client_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $progressLog->load(['client', 'program', 'comments']);

            return response()->json($progressLog);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching progress log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a progress log (Client or Admin only)
    public function delete(ProgressLog $progressLog)
    {
        try {
            // Verify ownership or admin
            if ($progressLog->client_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $progressLog->delete();

            return response()->json([
                'message' => 'Progress log deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting progress log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
