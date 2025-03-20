<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - LiftNote</title>
    <link rel="icon" type="image/jpeg" href="{{ asset('rei2.jpg') }}">
    <link href="{{ asset('css/admin.css') }}" rel="stylesheet">
</head>
<body class="center-screen">
    <div class="login-container">
        <h2 class="login-title">Admin Login</h2>
        <form action="{{ route('admin.login.post') }}" method="POST">
            @csrf
            <div class="form-group">
                <input id="email" name="email" type="email" required 
                    class="form-input" 
                    placeholder="Email address">
            </div>
            <div class="form-group">
                <input id="password" name="password" type="password" required 
                    class="form-input" 
                    placeholder="Password">
            </div>

            @if ($errors->any())
                <ul class="error-list">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            @endif

            <button type="submit" class="btn btn-primary">Sign in</button>
        </form>
    </div>
</body>
</html> 