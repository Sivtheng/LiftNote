<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
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

            return response()->json([
                'message' => 'Client registered successfully',
                'user' => $user,
                'token' => $token
            ], 201);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error during registration',
                'error' => $e->getMessage()
            ], 500);
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

            // Delete any existing tokens for this user
            $user->tokens()->delete();

            // Create new token with 1 hour expiration
            $token = $user->createToken('AuthToken', ['*'], now()->addHour())->plainTextToken;

            // Load appropriate relationships based on role
            if ($user->isClient()) {
                $user->load('progressLogs');
            } elseif ($user->isCoach()) {
                $user->load('programs');
            }

            return response()->json([
                'message' => 'Logged in successfully',
                'user' => $user,
                'token' => $token,
                'expires_at' => now()->addHour()->toDateTimeString()
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
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
                $user->load('progressLogs');
            } elseif ($user->isCoach()) {
                $user->load('programs');
            }

            return response()->json([
                'user' => $user,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User profile not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Profile fetch error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // API Logout
    public function logout(Request $request)
    {
        try {
            if ($request->user() && $request->user()->currentAccessToken()) {
                $request->user()->currentAccessToken()->delete();
            }
            
            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error during logout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Web Logout
    public function webLogout(Request $request)
    {
        try {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect()->route('admin.login');
        } catch (ModelNotFoundException $e) {
            return redirect()->route('admin.login')
                ->with('error', 'User not found');
        } catch (\Exception $e) {
            return redirect()->route('admin.login')
                ->with('error', 'Error during logout');
        }
    }

    // Web Login
    public function webLogin(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !$user->isAdmin()) {
            return back()->withErrors([
                'email' => 'Only administrators can access this area.',
            ])->withInput();
        }

        if (auth()->attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->intended('/admin');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->withInput();
    }

    // Web Login Form
    public function showLoginForm()
    {
        return view('auth.login');
    }

    // Web Admin Methods - Add these new methods
    public function index()
    {
        try {
            $users = User::latest()->paginate(10);
            return view('admin.users.index', compact('users'));
        } catch (ModelNotFoundException $e) {
            return back()->with('error', 'Users not found');
        } catch (\Exception $e) {
            return back()->with('error', 'Error fetching users');
        }
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
        } catch (ModelNotFoundException $e) {
            return $this->respondTo([
                'message' => 'User not found',
                'error' => $e->getMessage()
            ]);
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
        } catch (ModelNotFoundException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'User not found'
                ], 404);
            }
            return $this->respondTo([
                'message' => 'User not found',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Error updating user',
                    'error' => $e->getMessage()
                ], 500);
            }
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
        } catch (ModelNotFoundException $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'User not found'
                ], 404);
            }
            return $this->respondTo([
                'message' => 'User not found',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'message' => 'Error deleting user',
                    'error' => $e->getMessage()
                ], 500);
            }
            return $this->respondTo([
                'message' => 'Error deleting user',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'nullable|string|min:8|confirmed',
                'phone_number' => 'nullable|string|max:20',
                'bio' => 'nullable|string',
                'profile_picture' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'bio' => $request->bio,
                'profile_picture' => $request->profile_picture,
            ];

            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            // Delete all tokens first
            $user->tokens()->delete();
            
            // Delete the user
            $user->delete();

            return response()->json([
                'message' => 'Profile deleted successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Profile deletion error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUsers(Request $request)
    {
        try {
            // Only allow coaches and admins to fetch users
            if (!$request->user()->isCoach() && !$request->user()->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get all users with role 'client'
            $users = User::where('role', 'client')->get();

            return response()->json([
                'message' => 'Users retrieved successfully',
                'users' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUser(Request $request, User $user)
    {
        try {
            // Only allow coaches and admins to fetch user details
            if (!$request->user()->isCoach() && !$request->user()->isAdmin()) {
                return response()->json([
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Only allow fetching client users
            if ($user->role !== 'client') {
                return response()->json([
                    'message' => 'Can only fetch client users'
                ], 403);
            }

            // Load relationships if needed
            $user->load(['progressLogs', 'questionnaire']);

            return response()->json([
                'message' => 'User retrieved successfully',
                'user' => $user
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching user',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
