<?php

use Illuminate\Support\Facades\Route;

require __DIR__.'/api.php';

// Health check endpoint for deployment
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toISOString(),
        'version' => '1.0.0'
    ]);
});

// Root endpoint - API information
Route::get('/', function () {
    return response()->json([
        'message' => 'LiftNote API',
        'version' => '1.0.0',
        'endpoints' => [
            'health' => '/health',
            'api' => '/api',
            'documentation' => 'API endpoints available at /api/*'
        ]
    ]);
});

// Password reset endpoint (if needed for mobile app)
Route::get('/reset-password', function (Illuminate\Http\Request $request) {
    $token = $request->query('token');
    if (!$token) {
        return response()->json(['error' => 'Invalid password reset link.'], 400);
    }
    
    return response()->json([
        'message' => 'Password reset token received',
        'token' => $token
    ]);
})->name('password.reset');
