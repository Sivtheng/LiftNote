<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgressLog;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CommentController extends Controller
{
    public function index($programId)
    {
        $comments = Comment::where('program_id', $programId)
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['comments' => $comments]);
    }

    public function store(Request $request, $programId)
    {
        $request->validate([
            'content' => 'required|string',
            'media_type' => 'nullable|in:text,video,image',
            'media_url' => 'nullable|url',
            'parent_id' => 'nullable|exists:comments,id'
        ]);

        $comment = Comment::create([
            'content' => $request->content,
            'media_type' => $request->media_type ?? 'text',
            'media_url' => $request->media_url,
            'user_id' => auth()->id(),
            'program_id' => $programId,
            'parent_id' => $request->parent_id
        ]);

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => $comment->load(['user', 'replies.user'])
        ], 201);
    }

    public function update(Request $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $request->validate([
            'content' => 'required|string',
            'media_type' => 'nullable|in:text,video,image',
            'media_url' => 'nullable|url|required_if:media_type,video,image'
        ]);

        $comment->update([
            'content' => $request->content,
            'media_type' => $request->media_type ?? 'text',
            'media_url' => $request->media_url
        ]);

        $comment->load('user');

        return response()->json(['comment' => $comment]);
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(null, 204);
    }

    // Add comment to a program
    public function addProgramComment(Request $request, Program $program)
    {
        try {
            // Verify user has access to this program
            $user = Auth::user();
            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            // Validate input
            $validated = $request->validate([
                'content' => 'required|string'
            ]);

            // Create comment
            $comment = Comment::create([
                'content' => $validated['content'],
                'user_id' => Auth::id(),
                'program_id' => $program->id
            ]);

            return response()->json([
                'message' => 'Comment added successfully',
                'comment' => $comment->load(['user'])
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Program not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error adding comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update a program comment
    public function updateProgramComment(Request $request, Program $program, Comment $comment)
    {
        try {
            // Verify the comment belongs to this program
            if ($comment->program_id !== $program->id) {
                return response()->json(['message' => 'Comment not found'], 404);
            }

            // Verify ownership or admin
            if ($comment->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'content' => 'required|string'
            ]);

            // Update comment
            $comment->update($validated);

            return response()->json([
                'message' => 'Comment updated successfully',
                'comment' => $comment->fresh(['user'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a program comment
    public function deleteProgramComment(Program $program, Comment $comment)
    {
        try {
            // Verify the comment belongs to this program
            if ($comment->program_id !== $program->id) {
                return $this->respondTo([
                    'message' => 'Comment not found'
                ]);
            }

            // Verify ownership or admin
            if ($comment->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ]);
            }

            $comment->forceDelete(); // Use forceDelete to ensure actual deletion
            return $this->respondTo([
                'message' => 'Comment deleted successfully'
            ], 'programs.show');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error deleting comment',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Add comment to a progress log
    public function addProgressLogComment(Request $request, ProgressLog $progressLog)
    {
        try {
            // Verify user has access to this progress log
            $user = Auth::user();
            $program = $progressLog->program;

            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'content' => 'required|string'
            ]);

            // Create comment
            $comment = Comment::create([
                'content' => $validated['content'],
                'user_id' => Auth::id(),
                'progress_log_id' => $progressLog->id
            ]);

            return response()->json([
                'message' => 'Comment added successfully',
                'comment' => $comment->load(['user'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error adding comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update a progress log comment
    public function updateProgressLogComment(Request $request, ProgressLog $progressLog, Comment $comment)
    {
        try {
            // Verify the comment belongs to this progress log
            if ($comment->progress_log_id !== $progressLog->id) {
                return response()->json(['message' => 'Comment not found'], 404);
            }

            // Verify ownership or admin
            if ($comment->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate input
            $validated = $request->validate([
                'content' => 'required|string'
            ]);

            // Update comment
            $comment->update($validated);

            return response()->json([
                'message' => 'Comment updated successfully',
                'comment' => $comment->fresh(['user'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete a progress log comment
    public function deleteProgressLogComment(ProgressLog $progressLog, Comment $comment)
    {
        try {
            // Verify the comment belongs to this progress log
            if ($comment->progress_log_id !== $progressLog->id) {
                return $this->respondTo([
                    'message' => 'Comment not found'
                ]);
            }

            // Verify ownership or admin
            if ($comment->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
                return $this->respondTo([
                    'message' => 'Unauthorized'
                ]);
            }

            $comment->forceDelete(); // Use forceDelete to ensure actual deletion
            return $this->respondTo([
                'message' => 'Comment deleted successfully'
            ], 'progress-logs.show');
        } catch (\Exception $e) {
            return $this->respondTo([
                'message' => 'Error deleting comment',
                'error' => $e->getMessage()
            ]);
        }
    }

    // Get comments for a program
    public function getProgramComments(Program $program)
    {
        try {
            // Verify access rights
            $user = Auth::user();
            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $comments = Comment::where('program_id', $program->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($comments);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get comments for a progress log
    public function getProgressLogComments(ProgressLog $progressLog)
    {
        try {
            // Verify access rights
            $user = Auth::user();
            $program = $progressLog->program;

            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $comments = Comment::where('progress_log_id', $progressLog->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($comments);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get recent comments across all programs
    public function getRecentComments()
    {
        try {
            $user = Auth::user();
            
            // Get comments from clients in programs where user is either coach or client
            $comments = Comment::whereHas('program', function ($query) use ($user) {
                $query->where('coach_id', $user->id)
                    ->orWhere('client_id', $user->id);
            })
            ->whereHas('user', function ($query) {
                $query->where('role', 'client');
            })
            ->whereNotNull('program_id')
            ->with(['user', 'program'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

            return response()->json(['comments' => $comments]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching recent comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
