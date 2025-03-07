<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgressLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProgressLogController extends Controller
{
    // API Methods
    public function createForProgram(Request $request, Program $program)
    {
        try {
            if ($program->client_id !== Auth::id()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ]);
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
                'client_id' => Auth::id(),
                'program_id' => $program->id
            ]);

            return $this->respondTo([
                'message' => 'Progress log created successfully',
                'progress_log' => $progressLog->load(['client', 'program'])
            ]);
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error creating progress log',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getProgramLogs(Program $program)
    {
        try {
            $user = Auth::user();
            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ]);
            }

            $logs = $program->progressLogs()
                ->with(['client'])
                ->orderBy('date', 'desc')
                ->get();

            return $this->respondTo([
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error fetching progress logs',
                'error' => $e->getMessage()
            ]);
        }
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'date' => 'required|date',
                'client_id' => 'required|exists:users,id',
                'program_id' => 'required|exists:programs,id'
            ]);

            $progressLog = ProgressLog::create($validated);

            return $this->respondTo([
                'message' => 'Progress log created successfully',
                'progress_log' => $progressLog
            ], 'progress-logs.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error creating progress log',
                'error' => $e->getMessage()
            ]);
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
                    return $this->respondTo([
                        'message' => 'Unauthorized'
                    ]);
                }

                return $this->respondTo([
                    'progress_log' => $progressLog->load(['client', 'program', 'comments'])
                ]);
            } catch (\Exception $e) {
                return $this->respondTo([
                    'message' => 'Error fetching progress log',
                    'error' => $e->getMessage()
                ]);
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
}

