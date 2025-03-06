<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuestionnaireController;
use App\Http\Controllers\ProgramController;

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

    // Program Routes
    Route::prefix('programs')->group(function () {
        // Coach/Admin Routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::post('/users/{client}', [ProgramController::class, 'create']);
            Route::get('/coach', [ProgramController::class, 'getCoachPrograms']);
            Route::put('/{program}', [ProgramController::class, 'update']);
            Route::delete('/{program}', [ProgramController::class, 'delete']);
        });

        // Client Routes
        Route::middleware('role:client')->group(function () {
            Route::get('/client', [ProgramController::class, 'getClientPrograms']);
        });

        // Shared Routes (authorized in controller)
        Route::get('/{program}', [ProgramController::class, 'show']);
    });
});