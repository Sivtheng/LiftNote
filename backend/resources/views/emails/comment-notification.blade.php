<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $isReply ? 'New Reply' : 'New Comment' }} from {{ $coachName }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007AFF;
            margin-bottom: 10px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .content {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #007AFF;
        }
        .program-info {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007AFF;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .coach-name {
            font-weight: bold;
            color: #007AFF;
        }
        .comment-content {
            font-style: italic;
            margin: 10px 0;
            padding: 10px;
            background-color: #ffffff;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">LiftNote</div>
            <h2>{{ $isReply ? 'New Reply' : 'New Comment' }} from Your Coach</h2>
        </div>
        
        <div class="greeting">
            Hi {{ $clientName }},
        </div>
        
        <p>Your coach <span class="coach-name">{{ $coachName }}</span> has {{ $isReply ? 'replied to a comment' : 'left a new comment' }} on your program.</p>
        
        <div class="program-info">
            <strong>Program:</strong> {{ $programTitle }}
        </div>
        
        <div class="content">
            <strong>{{ $isReply ? 'Reply' : 'Comment' }}:</strong>
            <div class="comment-content">
                "{{ $commentContent }}"
            </div>
        </div>
        
        <p>Click the button below to view the {{ $isReply ? 'reply' : 'comment' }} and respond:</p>
        
        <a href="{{ $frontendUrl }}/program/{{ $programId ?? '' }}" class="button">
            View {{ $isReply ? 'Reply' : 'Comment' }}
        </a>
        
        <div class="footer">
            <p>This is an automated message from LiftNote. Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} LiftNote. All rights reserved.</p>
        </div>
    </div>
</body>
</html> 