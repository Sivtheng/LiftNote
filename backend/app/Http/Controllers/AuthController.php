<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Coach;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // Register a new client
    public function register(Request $request){
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:clients',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $client = Client::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $client->createToken('ClientToken')->plainTextToken;

        return response()->json([
            'client' => $client,
            'role' => 'client',
            'token' => $token,
        ], 201);
    }

    // Log in for admin, coach, and client
    public function login(Request $request){
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = Admin::where('email', $request->email)->first();
        $role = 'admin';
    
        if (!$user) {
            $user = Coach::where('email', $request->email)->first();
            $role = 'coach';
        }

        if (!$user) {
            $user = Client::where('email', $request->email)->first();
            $role = 'client';
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken(ucfirst($role) . 'Token')->plainTextToken;

        return response()->json([
            'client' => $user,
            'role' => $role,
            'token' => $token,
        ]);
    }

    // Get the authenticated user
    public function profile(Request $request){
        return response()->json([
            'user' => $request -> user(),
        ]);
    }

    // logout
    public function logout(Request $request){
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
