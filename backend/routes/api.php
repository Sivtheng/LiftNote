<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuestionnaireController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\ProgressLogController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\ProgramBuilderController;
use Illuminate\Http\Request;

// Public Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth Routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/picture', [AuthController::class, 'uploadProfilePicture']);
    Route::delete('/profile', [AuthController::class, 'deleteProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/push-token', [AuthController::class, 'updatePushToken']);
    Route::get('/users', [AuthController::class, 'getUsers']);
    Route::get('/users/{user}', [AuthController::class, 'getUser']);
    Route::post('/users', [AuthController::class, 'createClient']);
    Route::delete('/users/{user}', [AuthController::class, 'destroy']);

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
            Route::post('/{program}/duplicate', [ProgramController::class, 'duplicate']);
            Route::post('/{program}/assign-client', [ProgramController::class, 'assignClient']);
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

        // Coach Progress Log Routes
        Route::prefix('/{program}/progress/coach')->group(function () {
            Route::middleware('role:coach,admin')->group(function () {
                Route::get('/', [ProgressLogController::class, 'getProgramLogsForCoach']);
            });
        });

        // Comment Routes for Programs
        Route::prefix('/{program}/comments')->group(function () {
            // Get comments
            Route::get('/', [CommentController::class, 'getProgramComments']);
            
            // Add comment (client or coach only)
            Route::middleware('role:client,coach')->group(function () {
                Route::post('/', [CommentController::class, 'store']);
            });

            // Update and delete comments (comment owner or admin)
            Route::prefix('/{comment}')->group(function () {
                Route::put('/', [CommentController::class, 'updateProgramComment']);
                Route::delete('/', [CommentController::class, 'deleteProgramComment']);
            });
        });
    });

    // Progress Log Routes
    Route::post('/programs/{program}/progress', [ProgressLogController::class, 'store']);
    Route::get('/programs/{program}/progress', [ProgressLogController::class, 'getProgramLogs']);
    Route::get('/programs/{program}/days/{dayId}/progress', [ProgressLogController::class, 'getDayLogs']);

    // Progress Log Routes (for specific logs)
    Route::prefix('progress-logs')->group(function () {
        Route::get('/{progressLog}', [ProgressLogController::class, 'show']);
        
        // Client Routes
        Route::middleware('role:client')->group(function () {
            Route::put('/{progressLog}', [ProgressLogController::class, 'update']);
            Route::delete('/{progressLog}', [ProgressLogController::class, 'delete']);
        });
    });

    // Exercise Routes
    Route::prefix('exercises')->group(function () {
        Route::get('/', [ExerciseController::class, 'index']);
        Route::post('/', [ExerciseController::class, 'store']);
        Route::get('/search', [ExerciseController::class, 'search']);
        Route::get('/{exercise}', [ExerciseController::class, 'show']);
        Route::put('/{exercise}', [ExerciseController::class, 'update']);
        Route::delete('/{exercise}', [ExerciseController::class, 'destroy']);
    });

    // Program Builder Routes
    Route::prefix('programs/{program}/builder')->group(function () {
        // Week routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::get('/weeks', [ProgramBuilderController::class, 'getWeeks']);
            Route::post('/weeks', [ProgramBuilderController::class, 'addWeek']);
            Route::put('/weeks/{week}', [ProgramBuilderController::class, 'updateWeek']);
            Route::delete('/weeks/{week}', [ProgramBuilderController::class, 'deleteWeek']);
            Route::post('/weeks/{week}/duplicate', [ProgramBuilderController::class, 'duplicateWeek']);
        });

        // Program settings routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::put('/total-weeks', [ProgramBuilderController::class, 'updateTotalWeeks']);
        });

        // Day routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::get('/weeks/{week}/days', [ProgramBuilderController::class, 'getDays']);
            Route::post('/weeks/{week}/days', [ProgramBuilderController::class, 'addDay']);
            Route::put('/weeks/{week}/days/{day}', [ProgramBuilderController::class, 'updateDay']);
            Route::delete('/weeks/{week}/days/{day}', [ProgramBuilderController::class, 'deleteDay']);
            Route::post('/weeks/{week}/days/{day}/duplicate', [ProgramBuilderController::class, 'duplicateDay']);
        });

        // Exercise routes
        Route::middleware('role:coach,admin')->group(function () {
            Route::get('/weeks/{week}/days/{day}/exercises', [ProgramBuilderController::class, 'getExercises']);
            Route::post('/weeks/{week}/days/{day}/exercises', [ProgramBuilderController::class, 'addExercise']);
            Route::put('/weeks/{week}/days/{day}/exercises/{exercise}', [ProgramBuilderController::class, 'updateExercise']);
            Route::delete('/weeks/{week}/days/{day}/exercises/{exercise}', [ProgramBuilderController::class, 'deleteExercise']);
        });
    });

    Route::put('/programs/{program}/weeks/{week}/days/{day}/exercises/{exercise}', [ProgramBuilderController::class, 'updateExercise']);

    // Recent comments route
    Route::get('/comments/recent', [CommentController::class, 'recent']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Health check endpoint for deployment
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});