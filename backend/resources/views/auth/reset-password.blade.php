<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password - LiftNote</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #007AFF;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
            position: relative;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        .input-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        input {
            flex: 1;
            min-width: 0;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .password-toggle {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 0;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }
        .password-toggle:hover {
            color: #007AFF;
        }
        button {
            width: 100%;
            padding: 12px;
            background-color: #007AFF;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        button:disabled {
            background-color: #ccc;
        }
        .error {
            color: #dc3545;
            margin-top: 5px;
            font-size: 14px;
        }
        .success {
            color: #28a745;
            margin-top: 5px;
            font-size: 14px;
        }
        .success-message {
            text-align: center;
            padding: 20px;
        }
        .success-message h2 {
            color: #28a745;
            margin-bottom: 15px;
        }
        .success-message p {
            margin-bottom: 10px;
        }
        .close-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007AFF;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="resetForm">
            <h1>Reset Your Password</h1>
            
            <form id="passwordResetForm">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <div class="input-container">
                        <input type="password" id="password" name="password" required minlength="8">
                        <button type="button" class="password-toggle" onclick="togglePassword('password')">👁️</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="password_confirmation">Confirm New Password</label>
                    <div class="input-container">
                        <input type="password" id="password_confirmation" name="password_confirmation" required minlength="8">
                        <button type="button" class="password-toggle" onclick="togglePassword('password_confirmation')">👁️</button>
                    </div>
                </div>
                
                <button type="submit" id="submitButton">Reset Password</button>
            </form>
        </div>

        <div id="successMessage" style="display: none;" class="success-message">
            <h2>Password Reset Successful!</h2>
            <p>Your password has been reset successfully.</p>
            <p>You can now close this window and return to the LiftNote app to log in with your new password.</p>
            <a href="#" class="close-button" onclick="window.close()">Close Window</a>
        </div>
    </div>

    <script>
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const button = input.nextElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '👁️‍🗨️';
            } else {
                input.type = 'password';
                button.textContent = '👁️';
            }
        }

        document.getElementById('passwordResetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const passwordConfirmation = document.getElementById('password_confirmation').value;
            const submitButton = document.getElementById('submitButton');
            
            if (password !== passwordConfirmation) {
                alert('Passwords do not match');
                return;
            }
            
            submitButton.disabled = true;
            submitButton.textContent = 'Resetting...';
            
            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        token: '{{ $token }}',
                        password: password,
                        password_confirmation: passwordConfirmation
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('resetForm').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                } else {
                    alert(data.message || 'Failed to reset password');
                    submitButton.disabled = false;
                    submitButton.textContent = 'Reset Password';
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
                submitButton.disabled = false;
                submitButton.textContent = 'Reset Password';
            }
        });
    </script>
</body>
</html> 