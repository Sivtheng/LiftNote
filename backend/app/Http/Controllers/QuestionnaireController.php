<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Questionnaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class QuestionnaireController extends Controller
{
    // Standard questions that all clients need to answer
    private array $standardQuestions = [
        'current_weight' => 'What is your current weight (in kg)?',
        'height' => 'What is your height (in cm)?',
        'fitness_goal' => 'What are your primary fitness goals?',
        'medical_conditions' => 'Do you have any medical conditions we should be aware of?',
        'exercise_frequency' => 'How often do you currently exercise?',
        'preferred_exercise_time' => 'What time of day do you prefer to exercise?',
        'dietary_restrictions' => 'Do you have any dietary restrictions?',
        'previous_experience' => 'What is your previous experience with fitness training?',
        'injuries' => 'Do you have any current or past injuries?',
        'stress_level' => 'How would you rate your current stress level (1-10)?'
    ];

    // Get questionnaire for the authenticated client
    public function show()
    {
        try {
            $user = Auth::user();
            
            if (!$user->isClient()) {
                return response()->json([
                    'message' => 'Only clients can access questionnaires'
                ], 403);
            }

            // Get or create questionnaire for the client
            $questionnaire = Questionnaire::firstOrCreate(
                ['client_id' => $user->id],
                ['status' => 'pending']
            );

            return response()->json([
                'questions' => $this->standardQuestions,
                'questionnaire' => $questionnaire
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Questionnaire not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Submit answers to questionnaire
    public function submitAnswers(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->isClient()) {
                return response()->json([
                    'message' => 'Only clients can submit questionnaires'
                ], 403);
            }

            // Validate input
            $validated = $request->validate([
                'answers' => 'required|array',
                'answers.*' => 'required|string',
            ]);

            // Ensure all questions are answered
            $requiredKeys = array_keys($this->standardQuestions);
            $providedKeys = array_keys($validated['answers']);
            
            $missingKeys = array_diff($requiredKeys, $providedKeys);
            if (!empty($missingKeys)) {
                return response()->json([
                    'message' => 'Missing answers for some questions',
                    'error' => 'Missing questions: ' . implode(', ', $missingKeys)
                ], 422);
            }

            // Update or create questionnaire
            $questionnaire = Questionnaire::updateOrCreate(
                ['client_id' => $user->id],
                [
                    'answers' => $validated['answers'],
                    'status' => 'completed'
                ]
            );

            return response()->json([
                'message' => 'Questionnaire submitted successfully',
                'questionnaire' => $questionnaire
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error submitting questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get client's questionnaire (for coaches/admin)
    public function getClientQuestionnaire(User $client)
    {
        try {
            $user = Auth::user();
            
            if (!$user->isAdmin() && !$user->isCoach()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            if (!$client->isClient()) {
                return response()->json([
                    'message' => 'User is not a client'
                ], 422);
            }

            // Load the questionnaire with client relationship
            $questionnaire = Questionnaire::with('client')
                ->where('client_id', $client->id)
                ->first();

            if (!$questionnaire) {
                return response()->json([
                    'message' => 'Client has not filled out the questionnaire yet',
                    'questions' => $this->standardQuestions,
                    'questionnaire' => null,
                    'client' => $client
                ]);
            }

            return response()->json([
                'questions' => $this->standardQuestions,
                'questionnaire' => $questionnaire,
                'client' => $client
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching client questionnaire',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $questionnaires = Questionnaire::with('client')->latest()->paginate(10);
        return view('admin.questionnaires.index', compact('questionnaires'));
    }

    public function destroy(Questionnaire $questionnaire)
    {
        try {
            $questionnaire->delete();
            return $this->respondTo([
                'message' => 'Questionnaire deleted successfully'
            ], 'questionnaires.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error deleting questionnaire',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Add this new method for admin view
    public function adminShow(Questionnaire $questionnaire)
    {
        $questionnaire->load('client');
        return view('admin.questionnaires.show', [
            'questionnaire' => $questionnaire,
            'questions' => $this->standardQuestions
        ]);
    }

    public function adminEdit(Questionnaire $questionnaire)
    {
        $clients = User::where('role', 'client')->get();
        return view('admin.questionnaires.edit', [
            'questionnaire' => $questionnaire,
            'questions' => $this->standardQuestions,
            'clients' => $clients
        ]);
    }

    public function adminUpdate(Request $request, Questionnaire $questionnaire)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:users,id',
            'status' => 'required|in:pending,completed,reviewed',
            'answers' => 'required|array',
            'answers.*' => 'required|string',
        ]);

        // Ensure all questions are answered
        $requiredKeys = array_keys($this->standardQuestions);
        $providedKeys = array_keys($validated['answers']);
        
        $missingKeys = array_diff($requiredKeys, $providedKeys);
        if (!empty($missingKeys)) {
            return back()
                ->withErrors(['answers' => 'Missing answers for some questions'])
                ->withInput();
        }

        $questionnaire->update($validated);
        return redirect()
            ->route('questionnaires.show', $questionnaire)
            ->with('success', 'Questionnaire updated successfully');
    }

    public function adminCreate()
    {
        $clients = User::where('role', 'client')->get();
        return view('admin.questionnaires.create', [
            'questions' => $this->standardQuestions,
            'clients' => $clients
        ]);
    }

    public function adminStore(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:users,id',
            'status' => 'required|in:pending,completed,reviewed',
            'answers' => 'required|array',
            'answers.*' => 'required|string',
        ]);

        // Ensure all questions are answered
        $requiredKeys = array_keys($this->standardQuestions);
        $providedKeys = array_keys($validated['answers']);
        
        $missingKeys = array_diff($requiredKeys, $providedKeys);
        if (!empty($missingKeys)) {
            return $this->respondTo([
                'message' => 'Missing answers for some questions',
                'error' => 'Missing required answers'
            ]);
        }

        try {
            $questionnaire = Questionnaire::create($validated);
            return $this->respondTo([
                'message' => 'Questionnaire created successfully',
                'questionnaire' => $questionnaire
            ], 'questionnaires.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error creating questionnaire',
                'error' => $e->getMessage()
            ]);
        }
    }
}
