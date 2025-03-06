@extends('admin.layout')

@section('title', 'Dashboard')

@section('content')
<div class="stats-grid">
    <!-- Users Card -->
    <div class="stat-card">
        <div class="stat-card-content">
            <div class="stat-icon blue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </div>
            <div class="stat-info">
                <h3>Total Users</h3>
                <p>{{ $totalUsers }}</p>
            </div>
        </div>
    </div>

    <!-- Programs Card -->
    <div class="stat-card">
        <div class="stat-card-content">
            <div class="stat-icon green">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <div class="stat-info">
                <h3>Total Programs</h3>
                <p>{{ $totalPrograms }}</p>
            </div>
        </div>
    </div>

    <!-- Progress Logs Card -->
    <div class="stat-card">
        <div class="stat-card-content">
            <div class="stat-icon purple">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <div class="stat-info">
                <h3>Progress Logs</h3>
                <p>{{ $totalProgressLogs }}</p>
            </div>
        </div>
    </div>

    <!-- Questionnaires Card -->
    <div class="stat-card">
        <div class="stat-card-content">
            <div class="stat-icon yellow">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <div class="stat-info">
                <h3>Questionnaires</h3>
                <p>{{ $totalQuestionnaires }}</p>
            </div>
        </div>
    </div>
</div>

<!-- Recent Activity -->
<div class="activity-section">
    <h3 class="section-title">Recent Activity</h3>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @foreach($recentActivity as $activity)
                <tr>
                    <td>{{ $activity->user->name }}</td>
                    <td>{{ $activity->description }}</td>
                    <td>{{ $activity->created_at->diffForHumans() }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>
@endsection 