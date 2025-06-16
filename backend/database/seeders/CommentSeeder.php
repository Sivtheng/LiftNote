<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;
use App\Models\Program;
use App\Models\User;
use Carbon\Carbon;

class CommentSeeder extends Seeder
{
    public function run(): void
    {
        // Get Mike Wilson's program
        $mike = User::where('email', 'mike.w@example.com')->first();
        if (!$mike) return;

        $program = Program::where('client_id', $mike->id)->first();
        if (!$program) return;

        // Get all coaches
        $coaches = User::where('role', 'coach')->get();
        if ($coaches->isEmpty()) return;

        // Create main comments with varied timestamps
        // Create 3-5 main comments for the program
        $numComments = rand(3, 5);
        
        for ($i = 0; $i < $numComments; $i++) {
            // Create timestamp between 1-30 days ago
            $timestamp = Carbon::now()->subDays(rand(1, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));
            
            // Create a comment from Mike Wilson
            $comment = Comment::create([
                'program_id' => $program->id,
                'user_id' => $mike->id,
                'content' => $this->getRandomComment(),
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);

            // Create 0-3 replies for each main comment
            $numReplies = rand(0, 3);
            for ($j = 0; $j < $numReplies; $j++) {
                // Create reply timestamp between 1-24 hours after the parent comment
                $replyTimestamp = $timestamp->copy()->addHours(rand(1, 24))->addMinutes(rand(0, 59));
                
                // Get a random coach for this reply
                $replyUser = $coaches->random();
                
                Comment::create([
                    'program_id' => $program->id,
                    'user_id' => $replyUser->id,
                    'content' => $this->getRandomReply(),
                    'parent_id' => $comment->id,
                    'created_at' => $replyTimestamp,
                    'updated_at' => $replyTimestamp,
                ]);
            }
        }
    }

    private function getRandomComment(): string
    {
        $comments = [
            "Great progress on your workout today! Keep up the good work!",
            "Your form is looking much better. Remember to keep your back straight.",
            "I've noticed significant improvement in your strength. Well done!",
            "Let's focus on increasing the weight next session.",
            "Your dedication is really showing in your results.",
            "Don't forget to stay hydrated during your workouts.",
            "I'm impressed with your consistency. Keep it up!",
            "Your technique has improved a lot. Great job!",
            "Remember to take proper rest between sets.",
            "You're making excellent progress towards your goals.",
            "The way you're handling the exercises is getting better each time.",
            "Your energy levels during the session were impressive!",
            "Keep pushing yourself, but remember to listen to your body.",
            "Your commitment to the program is really paying off.",
            "I can see you're getting more comfortable with the movements."
        ];

        return $comments[array_rand($comments)];
    }

    private function getRandomReply(): string
    {
        $replies = [
            "Thanks for the feedback!",
            "I'll keep that in mind for next time.",
            "Appreciate the encouragement!",
            "Looking forward to the next session.",
            "I'll work on that.",
            "Thanks for the tip!",
            "I feel stronger already!",
            "Will do!",
            "Got it, thanks!",
            "I'm really enjoying the program.",
            "That means a lot coming from you!",
            "I'm starting to see the results too!",
            "I'll make sure to focus on that next time.",
            "Thanks for pushing me to do better!",
            "I'm feeling more confident with each session."
        ];

        return $replies[array_rand($replies)];
    }
} 