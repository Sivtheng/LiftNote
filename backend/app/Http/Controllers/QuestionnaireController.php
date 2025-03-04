<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Questionnaire;
use Illuminate\Http\Request;

class QuestionnaireController extends Controller
{
    // Store the questionnaire answers
    public function store(Request $request, Client $client)
    {
        // Validate input
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
        ]);

        // Save answer
        $questionnaire = new Questionnaire();
        $questionnaire->client_id = $client->id;
        $questionnaire->question = $validated['question'];
        $questionnaire->answer = $validated['answer'];
        $questionnaire->save();

        return response()->json(['message' => 'Questionnaire saved successfully!'], 201);
    }

    // Retrieve all answers for a client
    public function show(Client $client)
    {
        $answers = $client->questionnaires;

        return response()->json($answers);
    }
}
