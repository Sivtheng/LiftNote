<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuestionnaireController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\ProgressLogController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\ProgramBuilderController;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::delete('/profile', [AuthController::class, 'deleteProfile']);
    Route::get('/users', [AuthController::class, 'getUsers']);
    Route::get('/users/{user}', [AuthController::class, 'getUser']);

    // Questionnaire Routes
    Route::prefix('questionnaires')->group(function () {
        // Client Routes
        Route::middleware('role:client')->group(function () {
            Route::get('/mine', [QuestionnaireController::class, 'show']);
            Route::post('/submit', [QuestionnaireController::class, 'submitAnswers']);
        });

        // Coach/Admin Routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::get('/questions', [QuestionnaireController::class, 'getQuestions']);
            Route::post('/questions', [QuestionnaireController::class, 'updateQuestion']);
            Route::delete('/questions', [QuestionnaireController::class, 'deleteQuestion']);
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
            Route::delete('/{program}', [ProgramController::class, 'destroy']);
        });

        // Client Routes
        Route::middleware('role:client')->group(function () {
            Route::get('/client', [ProgramController::class, 'getClientPrograms']);
        });

        // Shared Routes (authorized in controller)
        Route::get('/{program}', [ProgramController::class, 'show']);

        // Progress Log Routes
        Route::prefix('/{program}/progress')->group(function () {
            // Client Routes
            Route::middleware('role:client')->group(function () {
                Route::post('/', [ProgressLogController::class, 'createForProgram']);
            });

            // Shared Routes (authorized in controller)
            Route::get('/', [ProgressLogController::class, 'getProgramLogs']);
        });

        // Comment Routes for Programs
        Route::prefix('/{program}/comments')->group(function () {
            // Get comments
            Route::get('/', [CommentController::class, 'getProgramComments']);
            
            // Add comment (client or coach only)
            Route::middleware('role:client,coach')->group(function () {
                Route::post('/', [CommentController::class, 'addProgramComment']);
            });

            // Update and delete comments (comment owner or admin)
            Route::prefix('/{comment}')->group(function () {
                Route::put('/', [CommentController::class, 'updateProgramComment']);
                Route::delete('/', [CommentController::class, 'deleteProgramComment']);
            });
        });
    });

    // Progress Log Routes (for specific logs)
    Route::prefix('progress-logs')->group(function () {
        Route::get('/{progressLog}', [ProgressLogController::class, 'show']);
        
        // Client Routes
        Route::middleware('role:client')->group(function () {
            Route::put('/{progressLog}', [ProgressLogController::class, 'update']);
            Route::delete('/{progressLog}', [ProgressLogController::class, 'delete']);
        });

        // Comment Routes for Progress Logs
        Route::prefix('/{progressLog}/comments')->group(function () {
            // Get comments
            Route::get('/', [CommentController::class, 'getProgressLogComments']);
            
            // Add comment (client or coach only)
            Route::middleware('role:client,coach')->group(function () {
                Route::post('/', [CommentController::class, 'addProgressLogComment']);
            });

            // Update and delete comments (comment owner or admin)
            Route::prefix('/{comment}')->group(function () {
                Route::put('/', [CommentController::class, 'updateProgressLogComment']);
                Route::delete('/', [CommentController::class, 'deleteProgressLogComment']);
            });
        });
    });

    // Exercise Routes
    Route::prefix('exercises')->group(function () {
        Route::get('/', [ExerciseController::class, 'index']);
        Route::post('/', [ExerciseController::class, 'store']);
        Route::get('/search', [ExerciseController::class, 'search']);
    });

    // Program Builder Routes
    Route::prefix('programs/{program}/builder')->group(function () {
        Route::post('/weeks', [ProgramBuilderController::class, 'addWeek']);
        Route::put('/weeks/{week}', [ProgramBuilderController::class, 'updateWeek']);
        Route::delete('/weeks/{week}', [ProgramBuilderController::class, 'deleteWeek']);
        
        Route::post('/weeks/{week}/days', [ProgramBuilderController::class, 'addDay']);
        Route::put('/days/{day}', [ProgramBuilderController::class, 'updateDay']);
        Route::delete('/days/{day}', [ProgramBuilderController::class, 'deleteDay']);
        
        Route::post('/days/{day}/exercises', [ProgramBuilderController::class, 'addExercise']);
        Route::delete('/days/{day}/exercises/{exercise}', [ProgramBuilderController::class, 'removeExercise']);
    });
});