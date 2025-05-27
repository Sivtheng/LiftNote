<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ProgressLogController extends Controller
{
    // API Methods
    public function createForProgram(Request $request, Program $program)
    {
        try {
            if ($program->client_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'date' => 'required|date'
            ]);

            $progressLog = ProgressLog::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'date' => $validated['date'],
                'user_id' => Auth::id(),
                'program_id' => $program->id
            ]);

            return response()->json([
                'message' => 'Progress log created successfully',
                'progress_log' => $progressLog->load(['user', 'program'])
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Program not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating progress log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getProgramLogs(Program $program)
    {
        $logs = ProgressLog::with(['exercise', 'week', 'day'])
            ->where('program_id', $program->id)
            ->where('user_id', Auth::id())
            ->orderBy('completed_at', 'desc')
            ->get();

        return response()->json([
            'logs' => $logs
        ]);
    }

    public function getDayLogs(Program $program, $dayId)
    {
        $logs = ProgressLog::with(['exercise'])
            ->where('program_id', $program->id)
            ->where('user_id', Auth::id())
            ->where('day_id', $dayId)
            ->orderBy('completed_at', 'desc')
            ->get();

        return response()->json([
            'logs' => $logs
        ]);
    }

    // Web Admin Methods
    public function index()
    {
        $progressLogs = ProgressLog::with(['client', 'program'])
            ->latest()
            ->paginate(10);
        return view('admin.progress-logs.index', compact('progressLogs'));
    }

    public function create()
    {
        $programs = Program::with(['client', 'coach'])->get();
        $clients = User::where('role', 'client')->get();
        return view('admin.progress-logs.create', compact('programs', 'clients'));
    }

    public function store(Request $request, Program $program)
    {
        $request->validate([
            'exercise_id' => 'required|exists:exercises,id',
            'day_id' => 'required|exists:program_days,id',
            'week_id' => 'required|exists:program_weeks,id',
            'weight' => 'nullable|numeric|min:0',
            'reps' => 'nullable|integer|min:0',
            'time_seconds' => 'nullable|integer|min:0',
            'rpe' => 'nullable|integer|min:1|max:10',
            'completed_at' => 'required|date'
        ]);

        $log = ProgressLog::create([
            'program_id' => $program->id,
            'user_id' => Auth::id(),
            'exercise_id' => $request->exercise_id,
            'day_id' => $request->day_id,
            'week_id' => $request->week_id,
            'weight' => $request->weight,
            'reps' => $request->reps,
            'time_seconds' => $request->time_seconds,
            'rpe' => $request->rpe,
            'completed_at' => $request->completed_at
        ]);

        return response()->json([
            'message' => 'Progress log created successfully',
            'log' => $log
        ], 201);
    }

    public function show(ProgressLog $progressLog)
    {
        if (request()->expectsJson()) {
            try {
                $user = Auth::user();
                $program = $progressLog->program;

                if (!$user->isAdmin() && 
                    $program->coach_id !== $user->id && 
                    $progressLog->client_id !== $user->id) {
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }

                return response()->json([
                    'progress_log' => $progressLog->load(['client', 'program', 'comments'])
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Error fetching progress log',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        $progressLog->load(['client', 'program', 'comments.user']);
        return view('admin.progress-logs.show', compact('progressLog'));
    }

    public function edit(ProgressLog $progressLog)
    {
        $programs = Program::with(['client', 'coach'])->get();
        $clients = User::where('role', 'client')->get();
        return view('admin.progress-logs.edit', 
            compact('progressLog', 'programs', 'clients')
        );
    }

    public function update(Request $request, ProgressLog $progressLog)
    {
        try {
            if (request()->expectsJson()) {
                // API request
                $user = Auth::user();
                if (!$user->isAdmin() && $progressLog->client_id !== $user->id) {
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }

                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'required|string',
                    'date' => 'required|date'
                ]);

                $progressLog->update($validated);

                return response()->json([
                    'message' => 'Progress log updated successfully',
                    'progress_log' => $progressLog->fresh(['client', 'program'])
                ]);
            }

            // Web request
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'date' => 'required|date',
                'client_id' => 'required|exists:users,id',
                'program_id' => 'required|exists:programs,id'
            ]);

            $progressLog->update($validated);

            return $this->respondTo([
                'message' => 'Progress log updated successfully',
                'progress_log' => $progressLog->fresh(['client', 'program'])
            ], 'progress-logs.index');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Error updating progress log',
                    'error' => $e->getMessage()
                ], 500);
            }
            return $this->respondTo([
                'message' => 'Error updating progress log',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function destroy(ProgressLog $progressLog)
    {
        try {
            // Delete related comments first
            $progressLog->comments()->delete();
            
            // Delete the progress log
            $progressLog->delete();

            return $this->respondTo([
                'message' => 'Progress log deleted successfully'
            ], 'progress-logs.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error deleting progress log',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function delete(ProgressLog $progressLog)
    {
        try {
            $user = Auth::user();
            if (!$user->isAdmin() && $progressLog->client_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Delete related comments first
            $progressLog->comments()->delete();
            
            // Delete the progress log
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

