<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Traits\HandlesResponses;

class ProgramController extends Controller
{
    use HandlesResponses;

    // Create a new program for a client (Coach/Admin only)
    public function create(Request $request, User $client)
    {
        try {
            if (!$client->isClient()) {
                return $this->respondTo([
                    'message' => 'Target user is not a client'
                ]);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'status' => 'required|in:active,completed,cancelled'
            ]);

            $program = Program::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'status' => $validated['status'],
                'coach_id' => Auth::id(),
                'client_id' => $client->id
            ]);

            return $this->respondTo([
                'message' => 'Program created successfully',
                'program' => $program->load(['coach', 'client'])
            ]);
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error creating program',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Update an existing program (Coach/Admin only)
    public function update(Request $request, Program $program)
    {
        try {
            if (!request()->expectsJson() && !Auth::user()->isAdmin()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ]);
            }

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'coach_id' => 'required|exists:users,id',
                'client_id' => 'required|exists:users,id',
                'status' => 'required|in:active,completed,cancelled'
            ]);

            $program->update($validated);

            return $this->respondTo([
                'message' => 'Program updated successfully',
                'program' => $program->fresh(['coach', 'client'])
            ], 'programs.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error updating program',
                'error' => $e->getMessage()
            ]);
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

            return $this->respondTo([
                'programs' => $programs
            ]);
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error fetching programs',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Get all programs for authenticated client
    public function getClientPrograms()
    {
        try {
            $programs = Program::where('client_id', Auth::id())
                ->with(['coach', 'progressLogs'])
                ->get();

            return $this->respondTo([
                'programs' => $programs
            ]);
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error fetching programs',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Get specific program details
    public function show(Program $program)
    {
        if (request()->expectsJson()) {
            try {
                $user = Auth::user();
                if (!$user->isAdmin() && 
                    $program->coach_id !== $user->id && 
                    $program->client_id !== $user->id) {
                    return $this->respondTo([
                        'message' => 'Unauthorized'
                    ]);
                }

                return $this->respondTo([
                    'program' => $program->load(['coach', 'client', 'progressLogs'])
                ]);
            } catch (\Exception $e) {
                return $this->respondTo([
                    'message' => 'Error fetching program',
                    'error' => $e->getMessage()
                ]);
            }
        }

        $program->load(['coach', 'client', 'progressLogs']);
        return view('admin.programs.show', compact('program'));
    }

    // Delete a program (Coach/Admin only)
    public function destroy(Program $program)
    {
        try {
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ]);
            }

            // Delete related records first (if needed)
            $program->progressLogs()->delete();
            $program->comments()->delete();
            
            // Delete the program
            $program->delete();

            return $this->respondTo([
                'message' => 'Program deleted successfully'
            ], 'programs.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error deleting program',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function index()
    {
        $programs = Program::with(['coach', 'client'])
            ->latest()
            ->paginate(10);
        return view('admin.programs.index', compact('programs'));
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'coach_id' => 'required|exists:users,id',
                'client_id' => 'required|exists:users,id',
                'status' => 'required|in:active,completed,cancelled'
            ]);

            $program = Program::create($validated);

            return $this->respondTo([
                'message' => 'Program created successfully',
                'program' => $program
            ], 'programs.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error creating program',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function edit(Program $program)
    {
        $coaches = User::where('role', 'coach')->get();
        $clients = User::where('role', 'client')->get();
        return view('admin.programs.edit', compact('program', 'coaches', 'clients'));
    }
}
