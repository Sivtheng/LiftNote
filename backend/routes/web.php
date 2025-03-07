<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\ProgressLogController;
use App\Http\Controllers\QuestionnaireController;
use App\Http\Controllers\CommentController;

require __DIR__.'/api.php';

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/admin/login', function () {
        return view('admin.login');
    })->name('admin.login');
    Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');
});

// Admin routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');
    
    // Users (using AuthController for user management)
    Route::get('/users', [AuthController::class, 'index'])->name('users.index');
    Route::get('/users/create', [AuthController::class, 'create'])->name('users.create');
    Route::post('/users', [AuthController::class, 'store'])->name('users.store');
    Route::get('/users/{user}/edit', [AuthController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [AuthController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AuthController::class, 'destroy'])->name('users.destroy');

    // Programs
    Route::prefix('programs')->name('programs.')->group(function () {
        Route::get('/', [ProgramController::class, 'index'])->name('index');
        Route::get('/create', [ProgramController::class, 'create'])->name('create');
        Route::post('/', [ProgramController::class, 'store'])->name('store');
        Route::get('/{program}', [ProgramController::class, 'show'])->name('show');
        Route::get('/{program}/edit', [ProgramController::class, 'edit'])->name('edit');
        Route::put('/{program}', [ProgramController::class, 'update'])->name('update');
        Route::delete('/{program}', [ProgramController::class, 'destroy'])->name('destroy');
    });

    // Progress Logs
    Route::prefix('progress-logs')->name('progress-logs.')->group(function () {
        Route::get('/', [ProgressLogController::class, 'index'])->name('index');
        Route::get('/create', [ProgressLogController::class, 'create'])->name('create');
        Route::post('/', [ProgressLogController::class, 'store'])->name('store');
        Route::get('/{progressLog}', [ProgressLogController::class, 'show'])->name('show');
        Route::get('/{progressLog}/edit', [ProgressLogController::class, 'edit'])->name('edit');
        Route::put('/{progressLog}', [ProgressLogController::class, 'update'])->name('update');
        Route::delete('/{progressLog}', [ProgressLogController::class, 'destroy'])->name('destroy');
        
        // Comments for progress logs
        Route::post('/{progressLog}/comments', [CommentController::class, 'addProgressLogComment'])->name('comments.store');
        Route::put('/{progressLog}/comments/{comment}', [CommentController::class, 'updateProgressLogComment'])->name('comments.update');
        Route::delete('/{progressLog}/comments/{comment}', [CommentController::class, 'deleteProgressLogComment'])->name('comments.destroy');
    });

    // Questionnaires
    Route::prefix('questionnaires')->name('questionnaires.')->group(function () {
        Route::get('/', [QuestionnaireController::class, 'index'])->name('index');
        Route::get('/create', [QuestionnaireController::class, 'create'])->name('create');
        Route::post('/', [QuestionnaireController::class, 'store'])->name('store');
        Route::get('/{questionnaire}', [QuestionnaireController::class, 'show'])->name('show');
        Route::get('/{questionnaire}/edit', [QuestionnaireController::class, 'edit'])->name('edit');
        Route::put('/{questionnaire}', [QuestionnaireController::class, 'update'])->name('update');
        Route::delete('/{questionnaire}', [QuestionnaireController::class, 'destroy'])->name('destroy');
    });
});

// Redirect root to admin login if not authenticated
Route::get('/', function () {
    return redirect()->route('admin.login');
});
