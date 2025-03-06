<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\DashboardController;

require __DIR__.'/api.php';

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/admin/login', function () {
        return view('admin.login');
    })->name('admin.login');
    Route::post('/admin/login', [AdminAuthController::class, 'login'])->name('admin.login.post');
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');
    
    // Resource routes
    Route::resource('users', AdminUserController::class);
    Route::resource('programs', AdminProgramController::class);
    Route::resource('progress-logs', AdminProgressLogController::class);
    Route::resource('questionnaires', AdminQuestionnaireController::class);
});

// Redirect root to admin login if not authenticated
Route::get('/', function () {
    return redirect()->route('admin.login');
});
