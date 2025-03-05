<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Questionnaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuestionnaireController extends Controller
{
    // Store the questionnaire
    public function store(Request $request, User $client)
    {
        // Check if the target user is actually a client
        if (!$client->isClient()) {
            return response()->json(['message' => 'User is not a client'], 403);
        }

        // Check if the authenticated user is a coach or admin
        if (!Auth::user()->isCoach() && !Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate input
        $validated = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'questions' => 'required|array',
            'answers' => 'nullable|array',
            'status' => 'required|in:pending,completed'
        ]);

        // Save questionnaire
        $questionnaire = Questionnaire::create([
            'client_id' => $client->id,
            'program_id' => $validated['program_id'],
            'questions' => $validated['questions'],
            'answers' => $validated['answers'] ?? null,
            'status' => $validated['status']
        ]);

        return response()->json([
            'message' => 'Questionnaire saved successfully!',
            'questionnaire' => $questionnaire
        ], 201);
    }

    // Retrieve questionnaire for a specific client (for coaches/admins or the client themselves)
    public function show(User $client)
    {
        // Check if the target user is actually a client
        if (!$client->isClient()) {
            return response()->json(['message' => 'User is not a client'], 403);
        }

        // Check if the authenticated user is authorized
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isCoach() && $user->id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $questionnaires = $client->questionnaires()
            ->with(['program'])
            ->get();

        return response()->json($questionnaires);
    }

    // Retrieve questionnaires for the authenticated client
    public function showMine()
    {
        $user = Auth::user();
        
        if (!$user->isClient()) {
            return response()->json(['message' => 'Only clients can access this endpoint'], 403);
        }

        $questionnaires = $user->questionnaires()
            ->with(['program'])
            ->get();

        return response()->json($questionnaires);
    }
}
