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

    // Client Routes
    Route::middleware('role:client')->group(function () {
        Route::get('/my-questionnaires', [QuestionnaireController::class, 'showMine']);
    });

    // Coach Routes
    Route::middleware('role:coach,admin')->group(function () {
        Route::post('/users/{client}/questionnaires', [QuestionnaireController::class, 'store']);
    });

    // Shared Routes (Coach, Admin, or Own Client Data)
    Route::get('/users/{client}/questionnaires', [QuestionnaireController::class, 'show']);
});