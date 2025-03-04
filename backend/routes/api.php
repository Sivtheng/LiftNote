<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QuestionnaireController;

// Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::middleware('auth:sanctum')->get('/profile', [AuthController::class, 'profile']);

// Questionnaires Route
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/clients/{client}/questionnaire', [QuestionnaireController::class, 'store']);
    Route::get('/clients/{client}/questionnaire', [QuestionnaireController::class, 'show']);
});