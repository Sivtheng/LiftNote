<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - LiftNote Admin</title>
    <link rel="icon" type="image/jpeg" href="{{ asset('rei2.jpg') }}">
    <link href="{{ asset('css/admin.css') }}" rel="stylesheet">
</head>
<body>
    <div class="admin-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <h1>LiftNote Admin</h1>
            <nav class="sidebar-nav">
                <a href="{{ route('admin.dashboard') }}" 
                    class="{{ request()->routeIs('admin.dashboard') ? 'active' : '' }}">
                    Dashboard
                </a>
                <a href="{{ route('users.index') }}" 
                    class="{{ request()->routeIs('users.*') ? 'active' : '' }}">
                    Users
                </a>
                <a href="{{ route('programs.index') }}" 
                    class="{{ request()->routeIs('programs.*') ? 'active' : '' }}">
                    Programs
                </a>
                <a href="{{ route('progress-logs.index') }}" 
                    class="{{ request()->routeIs('progress-logs.*') ? 'active' : '' }}">
                    Progress Logs
                </a>
                <a href="{{ route('questionnaires.index') }}" 
                    class="{{ request()->routeIs('questionnaires.*') ? 'active' : '' }}">
                    Questionnaires
                </a>
            </nav>
            <div style="margin-top: auto; padding-top: 2rem;">
                <form action="{{ route('admin.logout') }}" method="POST">
                    @csrf
                    <button type="submit" class="btn btn-primary">
                        Logout
                    </button>
                </form>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <h2 class="page-title">@yield('title')</h2>

            @if (session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            @if (session('error'))
                <div class="alert alert-error">
                    {{ session('error') }}
                </div>
            @endif

            @yield('content')
        </div>
    </div>
</body>
</html> 