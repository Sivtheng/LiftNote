<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;
use App\Models\Program;
use App\Models\User;

class CommentSeeder extends Seeder
{
    public function run()
    {
        $programs = Program::all();
        $coach = User::where('role', 'coach')->first();

        $sampleComments = [
            [
                'content' => 'Great progress on the bench press today! Keep up the good work.',
                'media_type' => 'text'
            ],
            [
                'content' => 'Check out this form correction for your squat.',
                'media_type' => 'video',
                'media_url' => 'https://example.com/videos/squat-form.mp4'
            ],
            [
                'content' => 'Here\'s a reference image for the proper deadlift form.',
                'media_type' => 'image',
                'media_url' => 'https://example.com/images/deadlift-form.jpg'
            ],
            [
                'content' => 'Your endurance has improved significantly! Ready for the next challenge?',
                'media_type' => 'text'
            ],
            [
                'content' => 'Watch this video for the new exercise we\'ll be adding next week.',
                'media_type' => 'video',
                'media_url' => 'https://example.com/videos/new-exercise.mp4'
            ]
        ];

        foreach ($programs as $program) {
            $client = User::find($program->client_id);
            
            // Add coach comments
            foreach ($sampleComments as $comment) {
                Comment::create([
                    'content' => $comment['content'],
                    'user_id' => $coach->id,
                    'program_id' => $program->id,
                    'media_type' => $comment['media_type'],
                    'media_url' => $comment['media_url'] ?? null
                ]);
            }

            // Add client comments
            Comment::create([
                'content' => 'The new exercises are challenging but I can feel the progress!',
                'user_id' => $client->id,
                'program_id' => $program->id,
                'media_type' => 'text'
            ]);

            Comment::create([
                'content' => 'Here\'s a video of my last set. How\'s my form?',
                'user_id' => $client->id,
                'program_id' => $program->id,
                'media_type' => 'video',
                'media_url' => 'https://example.com/videos/client-form.mp4'
            ]);
        }
    }
} 