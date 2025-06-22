<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgressLog;
use App\Models\User;
use App\Models\ProgramWeek;
use App\Models\ProgramDay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;

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

    public function getProgramLogsForCoach(Program $program)
    {
        // Check if the authenticated user is the coach of this program
        if ($program->coach_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $logs = ProgressLog::with(['exercise', 'week', 'day', 'user'])
            ->where('program_id', $program->id)
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
        try {
            \Log::info('Creating progress log', [
                'program_id' => $program->id,
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            $validated = $request->validate([
                'exercise_id' => 'required_unless:is_rest_day,true|exists:exercises,id',
                'day_id' => 'required|exists:program_days,id',
                'week_id' => 'required|exists:program_weeks,id',
                'weight' => 'nullable|numeric|min:0',
                'reps' => 'nullable|integer|min:0',
                'time_seconds' => 'nullable|integer|min:0',
                'rpe' => 'nullable|numeric',
                'completed_at' => 'required|date',
                'workout_duration' => 'nullable|integer|min:0',
                'is_rest_day' => 'boolean'
            ]);

            \Log::info('Validation passed', ['validated_data' => $validated]);

            // Check for duplicate progress log (same exercise, same day, same user)
            $existingLog = ProgressLog::where('program_id', $program->id)
                ->where('user_id', Auth::id())
                ->where('day_id', $request->day_id)
                ->whereDate('completed_at', $request->completed_at);

            // For rest days, check if any rest day log exists for this day
            if ($request->is_rest_day) {
                $existingLog = $existingLog->where('is_rest_day', true);
            } else {
                // For exercise logs, check if the same exercise was already logged
                $existingLog = $existingLog->where('exercise_id', $request->exercise_id);
            }

            $existingLog = $existingLog->first();

            if ($existingLog) {
                \Log::warning('Duplicate progress log attempt', [
                    'existing_log_id' => $existingLog->id,
                    'program_id' => $program->id,
                    'user_id' => Auth::id(),
                    'day_id' => $request->day_id,
                    'exercise_id' => $request->exercise_id,
                    'is_rest_day' => $request->is_rest_day,
                    'completed_at' => $request->completed_at
                ]);

                return response()->json([
                    'message' => $request->is_rest_day 
                        ? 'Rest day already logged for this day'
                        : 'Progress log already exists for this exercise on this day',
                    'log' => $existingLog
                ], 409); // Conflict status code
            }

            // Create the progress log
            $progressLog = ProgressLog::create([
                'program_id' => $program->id,
                'user_id' => Auth::id(),
                'exercise_id' => $request->exercise_id,
                'day_id' => $request->day_id,
                'week_id' => $request->week_id,
                'weight' => $request->weight,
                'reps' => $request->reps,
                'time_seconds' => $request->time_seconds,
                'rpe' => $request->rpe,
                'completed_at' => $request->completed_at,
                'workout_duration' => $request->workout_duration,
                'is_rest_day' => $request->is_rest_day ?? false
            ]);

            // Check if this is the last exercise for this day
            $currentWeek = ProgramWeek::findOrFail($request->week_id);
            $currentDay = ProgramDay::findOrFail($request->day_id);
            
            // Get all exercises for this day
            $dayExercises = $currentDay->exercises()->count();
            // Count how many logs we have for this day
            $completedExercises = ProgressLog::where('program_id', $program->id)
                ->where('user_id', Auth::id())
                ->where('day_id', $request->day_id)
                ->whereDate('completed_at', date('Y-m-d'))
                ->count();

            // Only update program progress if all exercises for the day are completed
            if ($completedExercises >= $dayExercises) {
                // Check if this is the last day of the week
                $isLastDayOfWeek = $currentDay->order === $currentWeek->days()->max('order');
                
                if ($isLastDayOfWeek) {
                    // Check if this is the last week
                    $isLastWeek = $currentWeek->order === $program->weeks()->max('order');
                    
                    if ($isLastWeek) {
                        // Mark program as completed
                        $program->update([
                            'status' => 'completed',
                            'completed_at' => now()
                        ]);
                        Log::info('Program completed', ['program_id' => $program->id]);
                    } else {
                        // Move to first day of next week
                        $nextWeek = $program->weeks()
                            ->where('order', '>', $currentWeek->order)
                            ->orderBy('order')
                            ->first();
                        
                        if ($nextWeek) {
                            $firstDayOfNextWeek = $nextWeek->days()->orderBy('order')->first();
                            $program->update([
                                'current_week_id' => $nextWeek->id,
                                'current_day_id' => $firstDayOfNextWeek->id,
                                'completed_weeks' => $program->completed_weeks + 1
                            ]);
                            Log::info('Moved to next week', [
                                'program_id' => $program->id,
                                'new_week_id' => $nextWeek->id,
                                'new_day_id' => $firstDayOfNextWeek->id
                            ]);
                        }
                    }
                } else {
                    // Move to next day in current week
                    $nextDay = $currentWeek->days()
                        ->where('order', '>', $currentDay->order)
                        ->orderBy('order')
                        ->first();
                    
                    if ($nextDay) {
                        $program->update([
                            'current_day_id' => $nextDay->id,
                            'current_week_id' => $currentWeek->id
                        ]);
                        Log::info('Moved to next day', [
                            'program_id' => $program->id,
                            'new_day_id' => $nextDay->id,
                            'new_week_id' => $currentWeek->id
                        ]);
                    }
                }
            }

            Log::info('Progress log created successfully', ['log_id' => $progressLog->id]);

            return response()->json([
                'message' => 'Progress log created successfully',
                'log' => $progressLog
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Error creating progress log', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Error creating progress log',
                'error' => $e->getMessage()
            ], 500);
        }
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

