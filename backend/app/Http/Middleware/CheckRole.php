<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Check if user has any of the required roles
        foreach ($roles as $role) {
            $methodName = 'is' . ucfirst($role);
            if (method_exists($request->user(), $methodName) && $request->user()->$methodName()) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Unauthorized. Required role not found.'], 403);
    }
} 