<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

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
Route::get('/reset-password', function (Request $request) {
    $token = $request->query('token');
    return view('auth.reset-password', ['token' => $token]);
});
