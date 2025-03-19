<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Questionnaire;
use App\Models\QuestionnaireQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class QuestionnaireController extends Controller
{
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

            // Get all active questions ordered by their order field
            $questions = QuestionnaireQuestion::orderBy('order')->get()
                ->mapWithKeys(function ($question) {
                    return [$question->key => $question->question];
                });

            return response()->json([
                'questions' => $questions,
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

    // Get all questions (for coaches/admin)
    public function getQuestions()
    {
        try {
            $user = Auth::user();
            
            if (!$user->isAdmin() && !$user->isCoach()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $questions = QuestionnaireQuestion::orderBy('order')->get();

            return response()->json([
                'questions' => $questions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching questions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Create or update a question (for coaches/admin)
    public function updateQuestion(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->isAdmin() && !$user->isCoach()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'key' => 'required|string|max:255',
                'question' => 'required|string',
                'type' => 'required|string|in:text,number,select,textarea',
                'options' => 'nullable|array',
                'is_required' => 'boolean',
                'order' => 'integer'
            ]);

            $question = QuestionnaireQuestion::updateOrCreate(
                ['key' => $validated['key']],
                $validated
            );

            return response()->json([
                'message' => 'Question updated successfully',
                'question' => $question
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating question',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a question (for coaches/admin)
    public function deleteQuestion(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->isAdmin() && !$user->isCoach()) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'key' => 'required|string|exists:questionnaire_questions,key'
            ]);

            $question = QuestionnaireQuestion::where('key', $validated['key'])->first();
            $question->delete();

            return response()->json([
                'message' => 'Question deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting question',
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

            // Get all required questions
            $requiredQuestions = QuestionnaireQuestion::where('is_required', true)
                ->pluck('key')
                ->toArray();

            // Validate input
            $validated = $request->validate([
                'answers' => 'required|array',
                'answers.*' => 'required|string',
            ]);

            // Ensure all required questions are answered
            $missingKeys = array_diff($requiredQuestions, array_keys($validated['answers']));
            if (!empty($missingKeys)) {
                return response()->json([
                    'message' => 'Missing answers for required questions',
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

            // Get all questions
            $questions = QuestionnaireQuestion::orderBy('order')->get()
                ->mapWithKeys(function ($question) {
                    return [$question->key => $question->question];
                });

            if (!$questionnaire) {
                return response()->json([
                    'message' => 'Client has not filled out the questionnaire yet',
                    'questions' => $questions,
                    'questionnaire' => null,
                    'client' => $client
                ]);
            }

            return response()->json([
                'questions' => $questions,
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
