<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Traits\HandlesResponses;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Models\ProgramWeek;

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
                    'status' => 'required|in:active,completed,cancelled',
                    'total_weeks' => 'required|integer|min:1|max:52'
                ]);

                $program = Program::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'status' => $validated['status'],
                    'coach_id' => $request->coach_id ?? Auth::id(),
                    'client_id' => $client->id,
                    'total_weeks' => $validated['total_weeks']
                ]);

                // Set initial current week and day
                $firstWeek = $program->weeks()->orderBy('order')->first();
                if ($firstWeek) {
                    $firstDay = $firstWeek->days()->orderBy('order')->first();
                    if ($firstDay) {
                        $program->update([
                            'current_week_id' => $firstWeek->id,
                            'current_day_id' => $firstDay->id
                        ]);
                    }
                }

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
                ->coachPrograms()
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
                ->with([
                    'coach',
                    'client',
                    'current_week' => function($query) {
                        $query->with(['days' => function($query) {
                            $query->orderBy('order');
                        }]);
                    },
                    'current_day' => function($query) {
                        $query->with(['exercises' => function($query) {
                            $query->withPivot(['sets', 'reps', 'time_seconds', 'measurement_type', 'measurement_value']);
                        }]);
                    },
                    'weeks' => function($query) {
                        $query->orderBy('order');
                    },
                    'weeks.days' => function($query) {
                        $query->orderBy('order');
                    },
                    'weeks.days.exercises' => function($query) {
                        $query->withPivot(['sets', 'reps', 'time_seconds', 'measurement_type', 'measurement_value']);
                    },
                    'weeks.days.progressLogs' => function($query) {
                        $query->with('exercise')
                            ->orderBy('completed_at', 'desc');
                    }
                ])
                ->orderBy('created_at', 'desc')
                ->get();

            // Fix any programs that don't have current week/day set
            foreach ($programs as $program) {
                if (!$program->current_week_id || !$program->current_day_id) {
                    $firstWeek = $program->weeks()->orderBy('order')->first();
                    if ($firstWeek) {
                        $firstDay = $firstWeek->days()->orderBy('order')->first();
                        if ($firstDay) {
                            $program->update([
                                'current_week_id' => $firstWeek->id,
                                'current_day_id' => $firstDay->id
                            ]);
                        }
                    }
                }
            }

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
            // Load all relationships
            $program->load([
                'client',
                'weeks' => function($query) {
                    $query->orderBy('order');
                },
                'weeks.days' => function($query) {
                    $query->orderBy('order');
                },
                'weeks.days.exercises' => function($query) {
                    $query->withPivot(['sets', 'reps', 'time_seconds', 'measurement_type', 'measurement_value']);
                }
            ]);

            return response()->json([
                'program' => $program
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching program',
                'error' => $e->getMessage()
            ], 500);
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
                'status' => 'required|in:active,completed,cancelled',
                'total_weeks' => 'required|integer|min:1|max:52'
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

    // Mark a week as complete
    public function markWeekComplete(Request $request, Program $program, ProgramWeek $week)
    {
        try {
            // Verify week belongs to program
            if ($week->program_id !== $program->id) {
                return response()->json([
                    'message' => 'Week does not belong to this program'
                ], 400);
            }

            // Only client can mark their own program's week as complete
            if (Auth::id() !== $program->client_id) {
                return response()->json([
                    'message' => 'Only the client can mark weeks as complete'
                ], 403);
            }

            // Check if this week is the next one to be completed
            if ($week->order !== $program->completed_weeks + 1) {
                return response()->json([
                    'message' => 'Can only mark the next week in sequence as complete'
                ], 400);
            }

            // Update program's completed weeks
            $program->update([
                'completed_weeks' => $program->completed_weeks + 1
            ]);

            // If all weeks are completed, mark program as completed
            if ($program->completed_weeks >= $program->total_weeks) {
                $program->update(['status' => 'completed']);
            }

            return response()->json([
                'message' => 'Week marked as complete',
                'program' => $program->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error marking week as complete',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
