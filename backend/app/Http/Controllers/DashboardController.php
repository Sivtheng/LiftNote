<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Program;
use App\Models\ProgressLog;
use App\Models\Questionnaire;

class DashboardController extends Controller
{
    public function index()
    {
        return view('admin.dashboard.index', [
            'totalUsers' => User::count(),
            'totalPrograms' => Program::count(),
            'totalProgressLogs' => ProgressLog::count(),
            'totalQuestionnaires' => Questionnaire::count(),
        ]);
    }

    private function getRecentActivity()
    {
        // This is a placeholder. You might want to create an Activity model
        // to track user actions more comprehensively
        $recentPrograms = Program::with('user')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($program) {
                return (object) [
                    'user' => $program->user,
                    'description' => "Created program: {$program->name}",
                    'created_at' => $program->created_at
                ];
            });

        $recentLogs = ProgressLog::with('user')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($log) {
                return (object) [
                    'user' => $log->user,
                    'description' => "Added progress log",
                    'created_at' => $log->created_at
                ];
            });

        return $recentPrograms->concat($recentLogs)
            ->sortByDesc('created_at')
            ->take(10);
    }
} 