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

    public function __construct()
    {
        // Constructor without notification service
    }

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

            // Fix any programs that don't have current week/day set or have invalid ones
            foreach ($programs as $program) {
                $weekIds = $program->weeks()->pluck('id')->toArray();
                $dayIds = [];
                foreach ($program->weeks as $week) {
                    foreach ($week->days as $day) {
                        $dayIds[] = $day->id;
                    }
                }
                $needsReset = false;
                if (!$program->current_week_id || !in_array($program->current_week_id, $weekIds)) {
                    $needsReset = true;
                }
                if (!$program->current_day_id || !in_array($program->current_day_id, $dayIds)) {
                    $needsReset = true;
                }
                if ($needsReset) {
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

    // Duplicate a program (Coach/Admin only)
    public function duplicate(Program $program)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Create a new program with the same data but no client assigned
            $duplicatedProgram = Program::create([
                'title' => $program->title . ' (Copy)',
                'description' => $program->description,
                'coach_id' => Auth::id(),
                'client_id' => null, // No client assigned initially
                'status' => 'active',
                'total_weeks' => $program->total_weeks,
                'completed_weeks' => 0
            ]);

            // Duplicate weeks
            foreach ($program->weeks()->orderBy('order')->get() as $week) {
                $duplicatedWeek = $duplicatedProgram->weeks()->create([
                    'name' => $week->name,
                    'order' => $week->order
                ]);

                // Duplicate days
                foreach ($week->days()->orderBy('order')->get() as $day) {
                    $duplicatedDay = $duplicatedWeek->days()->create([
                        'name' => $day->name,
                        'order' => $day->order
                    ]);

                    // Duplicate exercises with their pivot data
                    foreach ($day->exercises as $exercise) {
                        $duplicatedDay->exercises()->attach($exercise->id, [
                            'sets' => $exercise->pivot->sets,
                            'reps' => $exercise->pivot->reps,
                            'time_seconds' => $exercise->pivot->time_seconds,
                            'measurement_type' => $exercise->pivot->measurement_type,
                            'measurement_value' => $exercise->pivot->measurement_value
                        ]);
                    }
                }
            }

            // Set the first week and day as current
            $firstWeek = $duplicatedProgram->weeks()->orderBy('order')->first();
            if ($firstWeek) {
                $firstDay = $firstWeek->days()->orderBy('order')->first();
                if ($firstDay) {
                    $duplicatedProgram->update([
                        'current_week_id' => $firstWeek->id,
                        'current_day_id' => $firstDay->id
                    ]);
                }
            }

            return response()->json([
                'message' => 'Program duplicated successfully',
                'program' => $duplicatedProgram->load(['coach', 'client', 'weeks.days.exercises'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error duplicating program',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Assign client to a program (Coach/Admin only)
    public function assignClient(Request $request, Program $program)
    {
        try {
            // Check authorization
            if (!Auth::user()->isAdmin() && $program->coach_id !== Auth::id()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Validate request
            $validated = $request->validate([
                'client_id' => 'required|exists:users,id'
            ]);

            // Check if the user is a client
            $client = User::find($validated['client_id']);
            if (!$client || !$client->isClient()) {
                return response()->json([
                    'message' => 'Invalid client ID'
                ], 422);
            }

            // Update the program with the client
            $program->update([
                'client_id' => $validated['client_id']
            ]);

            return response()->json([
                'message' => 'Client assigned successfully',
                'program' => $program->fresh(['coach', 'client'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error assigning client',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
