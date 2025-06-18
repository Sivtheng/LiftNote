<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        \Log::info('CheckRole middleware called', [
            'user_id' => $request->user()?->id,
            'user_role' => $request->user()?->role,
            'required_roles' => $roles,
            'path' => $request->path()
        ]);

        if (!$request->user()) {
            \Log::warning('No authenticated user found');
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('admin.login');
        }

        // If user is admin, allow access to everything
        if ($request->user()->isAdmin()) {
            \Log::info('User is admin, allowing access');
            return $next($request);
        }

        // Check if user has any of the required roles
        foreach ($roles as $role) {
            $methodName = 'is' . ucfirst($role);
            if (method_exists($request->user(), $methodName) && $request->user()->$methodName()) {
                \Log::info('User has required role', ['role' => $role]);
                return $next($request);
            }
        }

        \Log::warning('User does not have required role', [
            'user_role' => $request->user()->role,
            'required_roles' => $roles
        ]);

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthorized. Required role not found.'], 403);
        }
        return redirect()->route('admin.login')->with('error', 'Unauthorized access.');
    }
} 