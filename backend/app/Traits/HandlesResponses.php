<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait HandlesResponses
{
    protected function respondTo($data, $route = null)
    {
        // If it's an API route (starts with 'api')
        if (request()->segment(1) === 'api') {
            return response()->json($data);
        }

        if (request()->expectsJson()) {
            return response()->json($data);
        }

        if (isset($data['error'])) {
            return redirect()->back()
                ->with('error', $data['message'])
                ->withErrors(['error' => $data['error']])
                ->withInput();
        }

        if ($route) {
            return redirect()->route($route)
                ->with('success', $data['message']);
        }

        return redirect()->back()
            ->with('success', $data['message']);
    }
}