<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private $expoApiUrl = 'https://exp.host/--/api/v2/push/send';

    /**
     * Send push notification to a single user
     */
    public function sendToUser(User $user, string $title, string $body, array $data = [])
    {
        if (!$user->push_token) {
            Log::info('No push token for user', ['user_id' => $user->id]);
            return false;
        }

        return $this->sendPushNotification([$user->push_token], $title, $body, $data);
    }

    /**
     * Send push notification to multiple users
     */
    public function sendToUsers(array $users, string $title, string $body, array $data = [])
    {
        $tokens = collect($users)
            ->filter(function ($user) {
                return $user->push_token;
            })
            ->pluck('push_token')
            ->toArray();

        if (empty($tokens)) {
            Log::info('No push tokens found for users');
            return false;
        }

        return $this->sendPushNotification($tokens, $title, $body, $data);
    }

    /**
     * Send push notification to specific tokens
     */
    public function sendPushNotification(array $tokens, string $title, string $body, array $data = [])
    {
        try {
            $messages = [];
            
            foreach ($tokens as $token) {
                $messages[] = [
                    'to' => $token,
                    'title' => $title,
                    'body' => $body,
                    'data' => $data,
                    'sound' => 'default',
                    'priority' => 'high',
                    'channelId' => 'default',
                ];
            }

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Accept-encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ])->post($this->expoApiUrl, $messages);

            if ($response->successful()) {
                $responseData = $response->json();
                Log::info('Push notification sent successfully', [
                    'tokens_count' => count($tokens),
                    'response' => $responseData
                ]);
                return true;
            } else {
                Log::error('Failed to send push notification', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Error sending push notification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Send notification when coach adds/edits a comment
     */
    public function sendCommentNotification(User $client, string $coachName, string $programTitle, bool $isReply = false)
    {
        $title = $isReply ? 'New Reply from Coach' : 'New Comment from Coach';
        $body = $isReply 
            ? "{$coachName} replied to your comment in {$programTitle}"
            : "{$coachName} commented on your program: {$programTitle}";

        $data = [
            'type' => 'comment',
            'isReply' => $isReply,
            'coachName' => $coachName,
            'programTitle' => $programTitle
        ];

        return $this->sendToUser($client, $title, $body, $data);
    }

    /**
     * Send notification when coach updates program
     */
    public function sendProgramUpdateNotification(User $client, string $coachName, string $programTitle, string $updateType)
    {
        $title = 'Program Updated';
        $body = "{$coachName} updated your program: {$programTitle}";

        $data = [
            'type' => 'program_update',
            'updateType' => $updateType,
            'coachName' => $coachName,
            'programTitle' => $programTitle
        ];

        return $this->sendToUser($client, $title, $body, $data);
    }
} 