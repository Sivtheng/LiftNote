<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100vw;
            margin: 0;
            padding: 0;
            background: #f9f9f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            width: 100%;
            max-width: 400px;
            margin: 24px;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        h2 {
            text-align: center;
            margin-top: 0;
        }
        form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .input-group {
            position: relative;
            display: flex;
            align-items: center;
        }
        input[type="password"], input[type="text"] {
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
            font-size: 16px;
            width: 100%;
        }
        .toggle-password {
            position: absolute;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            color: #888;
        }
        button[type="submit"] {
            background-color: #007AFF;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
        }
        .success, .error {
            text-align: center;
            margin-bottom: 10px;
        }
        .success { color: green; }
        .error { color: red; }
        @media (max-width: 500px) {
            .container {
                max-width: 95vw;
                margin: 8px;
                padding: 12px;
            }
            input[type="password"], input[type="text"], button[type="submit"] {
                font-size: 15px;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Your Password</h2>
        <form method="POST" action="/api/reset-password">
            <input type="hidden" name="token" value="{{ $token }}">
            <div class="input-group">
                <input id="password" type="password" name="password" placeholder="New Password" required>
                <button type="button" class="toggle-password" onclick="togglePassword('password', this)">&#128065;</button>
            </div>
            <div class="input-group">
                <input id="password_confirmation" type="password" name="password_confirmation" placeholder="Confirm Password" required>
                <button type="button" class="toggle-password" onclick="togglePassword('password_confirmation', this)">&#128065;</button>
            </div>
            <button type="submit">Reset Password</button>
        </form>
    </div>
    <script>
        function togglePassword(inputId, btn) {
            const input = document.getElementById(inputId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '&#128064;'; // open eye
            } else {
                input.type = 'password';
                btn.innerHTML = '&#128065;'; // closed eye
            }
        }
    </script>
</body>
</html> 