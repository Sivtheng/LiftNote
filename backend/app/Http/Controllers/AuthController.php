<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // Register a new client
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone_number' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'profile_picture' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->respondTo([
                'message' => 'Validation failed',
                'error' => $validator->errors()
            ]);
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'client',
                'phone_number' => $request->phone_number,
                'bio' => $request->bio,
                'profile_picture' => $request->profile_picture,
            ]);

            $token = $user->createToken('AuthToken')->plainTextToken;

            return $this->respondTo([
                'message' => 'Client registered successfully',
                'user' => $user,
                'token' => $token
            ], 'users.index');

        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return $this->respondTo([
                'message' => 'Error during registration',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Login for all users
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $token = $user->createToken('AuthToken')->plainTextToken;

            // Load appropriate relationships based on role
            if ($user->isClient()) {
                $user->load('clientProfile');
            } elseif ($user->isCoach()) {
                $user->load('programs');
            }

            return response()->json([
                'message' => 'Logged in successfully',
                'user' => $user,
                'token' => $token,
            ]);
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error during login',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get authenticated user profile
    public function profile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            // Load relationships based on user role
            if ($user->isClient()) {
                $user->load(['clientProfile', 'progressLogs']);
            } elseif ($user->isCoach()) {
                $user->load(['programs']);
            }

            return response()->json([
                'user' => $user,
            ]);
        } catch (\Exception $e) {
            Log::error('Profile fetch error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Logout
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error during logout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Web Admin Methods - Add these new methods
    public function index()
    {
        $users = User::latest()->paginate(10);
        return view('admin.users.index', compact('users'));
    }

    public function create()
    {
        return view('admin.users.create');
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'required|in:client,coach,admin',
                'phone_number' => 'nullable|string|max:20',
                'bio' => 'nullable|string',
                'profile_picture' => 'nullable|string',
            ]);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'phone_number' => $validated['phone_number'] ?? null,
                'bio' => $validated['bio'] ?? null,
                'profile_picture' => $validated['profile_picture'] ?? null,
            ]);

            return $this->respondTo([
                'message' => 'User created successfully',
                'user' => $user
            ], 'users.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error creating user',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function edit(User $user)
    {
        return view('admin.users.edit', compact('user'));
    }

    public function update(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'nullable|string|min:8|confirmed',
                'role' => 'required|in:client,coach,admin',
                'phone_number' => 'nullable|string|max:20',
                'bio' => 'nullable|string',
                'profile_picture' => 'nullable|string',
            ]);

            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
                'phone_number' => $validated['phone_number'] ?? $user->phone_number,
                'bio' => $validated['bio'] ?? $user->bio,
                'profile_picture' => $validated['profile_picture'] ?? $user->profile_picture,
            ];

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);

            return $this->respondTo([
                'message' => 'User updated successfully',
                'user' => $user
            ], 'users.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error updating user',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function destroy(User $user)
    {
        try {
            if ($user->id === auth()->id()) {
                return $this->respondTo([
                    'message' => 'Cannot delete your own account',
                    'error' => 'Self deletion not allowed'
                ]);
            }

            // Use regular delete() since we want to keep soft deletes for data integrity
            $user->delete();

            return $this->respondTo([
                'message' => 'User deleted successfully'
            ], 'users.index');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error deleting user',
                'error' => $e->getMessage()
            ]);
        }
    }
}
