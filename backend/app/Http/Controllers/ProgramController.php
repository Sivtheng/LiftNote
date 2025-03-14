<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Traits\HandlesResponses;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ProgramController extends Controller
{
    use HandlesResponses;

    // Create a new program for a client (Coach/Admin only)
    public function create(Request $request, User $client = null)
    {
        try {
            // Allow admin and coach to create programs
            if (!Auth::user()->isAdmin() && !Auth::user()->isCoach()) {
                if ($client) { // API request
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ], null, 403);
            }

            // If this is an API request (has client parameter)
            if ($client) {
                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'required|string',
                    'status' => 'required|in:active,completed,cancelled'
                ]);

                $program = Program::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'status' => $validated['status'],
                    'coach_id' => $request->coach_id ?? Auth::id(),
                    'client_id' => $client->id
                ]);

                return response()->json([
                    'message' => 'Program created successfully',
                    'program' => $program->load(['coach', 'client'])
                ]);
            }

            // For web form display
            $coaches = User::where('role', 'coach')->get();
            $clients = User::where('role', 'client')->get();
            return view('admin.programs.create', compact('coaches', 'clients'));
            
        } catch (ModelNotFoundException $e) {
            if ($client) { // API request
                return response()->json([
                    'message' => 'Client not found'
                ], 404);
            }
            return $this->respondTo([
                'message' => 'Client not found',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            if ($client) { // API request
                return response()->json([
                    'message' => 'Error creating program',
                    'error' => $e->getMessage()
                ], 500);
            }
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
            if (request()->expectsJson()) {
                // Check if program exists (although Laravel's route model binding should handle this)
                if (!$program->exists) {
                    return response()->json([
                        'message' => 'Program not found'
                    ], 404);
                }

                // API request
                if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }

                $validated = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'required|string',
                    'status' => 'required|in:active,completed,cancelled'
                ]);

                $program->update($validated);

                return response()->json([
                    'message' => 'Program updated successfully',
                    'program' => $program->fresh(['coach', 'client'])
                ]);
            }

            // Web request
            if (!Auth::user()->isAdmin()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ], null, 403);
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
        } catch (ModelNotFoundException $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Program not found'
                ], 404);
            }
            return $this->respondTo([
                'message' => 'Program not found',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Error updating program',
                    'error' => $e->getMessage()
                ], 500);
            }
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

            return response()->json([
                'programs' => $programs
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Coach not found'
            ], 404);
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

            return response()->json([
                'programs' => $programs
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Client not found'
            ], 404);
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
            if (request()->expectsJson()) {
                // API request
                $user = Auth::user();
                if (!$user->isAdmin() && 
                    $program->coach_id !== $user->id && 
                    $program->client_id !== $user->id) {
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }

                return response()->json([
                    'program' => $program->load(['coach', 'client', 'progressLogs'])
                ]);
            }

            // Web request
            $program->load(['coach', 'client', 'progressLogs']);
            return view('admin.programs.show', compact('program'));
        } catch (ModelNotFoundException $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Program not found'
                ], 404);
            }
            return $this->respondTo([
                'message' => 'Program not found',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Error fetching program',
                    'error' => $e->getMessage()
                ], 500);
            }
            return $this->respondTo([
                'message' => 'Error fetching program',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Delete a program (Coach/Admin only)
    public function destroy(Program $program)
    {
        try {
            if (request()->expectsJson()) {
                // API request
                if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                    return response()->json([
                        'message' => 'Unauthorized'
                    ], 403);
                }

                $program->progressLogs()->delete();
                $program->comments()->delete();
                $program->delete();

                return response()->json([
                    'message' => 'Program deleted successfully'
                ]);
            }

            // Web request
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ], null, 403);
            }

            $program->progressLogs()->delete();
            $program->comments()->delete();
            $program->delete();

            return $this->respondTo([
                'message' => 'Program deleted successfully'
            ], 'programs.index');
        } catch (ModelNotFoundException $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Program not found'
                ], 404);
            }
            return $this->respondTo([
                'message' => 'Program not found',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Error deleting program',
                    'error' => $e->getMessage()
                ], 500);
            }
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
            // Check if user is authorized
            if (!Auth::user()->isAdmin() && !Auth::user()->isCoach()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ], null, 403);
            }

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
                'program' => $program->load(['coach', 'client'])
            ], 'programs.index');
        } catch (ModelNotFoundException $e) {
            return $this->respondTo([
                'message' => 'User not found',
                'error' => $e->getMessage()
            ]);
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
