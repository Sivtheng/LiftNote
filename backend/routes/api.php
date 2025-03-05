<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuestionnaireController;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);

    // Questionnaire Routes
    Route::prefix('questionnaires')->group(function () {
        // Client Routes
        Route::middleware('role:client')->group(function () {
            Route::get('/mine', [QuestionnaireController::class, 'show']);
            Route::post('/submit', [QuestionnaireController::class, 'submitAnswers']);
        });

        // Coach/Admin Routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::get('/users/{client}', [QuestionnaireController::class, 'getClientQuestionnaire']);
        });
    });
});