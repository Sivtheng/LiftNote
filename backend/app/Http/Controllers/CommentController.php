<?php

namespace App\Http\Controllers;

use App\Models\Program;
use App\Models\ProgressLog;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\Rule;
use App\Services\SpacesService;
use Illuminate\Support\Str;

class CommentController extends Controller
{
    protected $spacesService;

    public function __construct(SpacesService $spacesService)
    {
        $this->spacesService = $spacesService;
    }

    public function index(Program $program)
    {
        $comments = $program->comments()
            ->with(['user', 'replies.user'])
            ->whereNull('parent_id')
            ->latest()
            ->get();

        return response()->json([
            'comments' => $comments
        ]);
    }

    public function store(Request $request, Program $program)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'media_type' => ['nullable', Rule::in(['text', 'image', 'video'])],
            'media_file' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:10240', // 10MB max
            'parent_id' => 'nullable|exists:comments,id'
        ]);

        $mediaUrl = null;
        if ($request->hasFile('media_file')) {
            $file = $request->file('media_file');
            $mediaType = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 'video';
            $mediaUrl = $this->spacesService->uploadFile($file, 'comments');
        }

        $comment = $program->comments()->create([
            'content' => $validated['content'],
            'media_type' => $mediaUrl ? ($mediaType ?? 'text') : 'text',
            'media_url' => $mediaUrl,
            'parent_id' => $validated['parent_id'] ?? null,
            'user_id' => Auth::id()
        ]);

        $comment->load('user');

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => $comment
        ], 201);
    }

    public function update(Request $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'media_file' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:10240', // 10MB max
        ]);

        $mediaUrl = $comment->media_url;
        if ($request->hasFile('media_file')) {
            // Delete old file if exists
            if ($mediaUrl) {
                $this->spacesService->deleteFile($mediaUrl);
            }

            $file = $request->file('media_file');
            $mediaType = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 'video';
            $mediaUrl = $this->spacesService->uploadFile($file, 'comments');
        }

        $comment->update([
            'content' => $validated['content'],
            'media_type' => $mediaUrl ? ($mediaType ?? 'text') : 'text',
            'media_url' => $mediaUrl
        ]);

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment
        ]);
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        // Delete associated file if exists
        if ($comment->media_url) {
            $this->spacesService->deleteFile($comment->media_url);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully'
        ]);
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

    public function recent()
    {
        $comments = Comment::with(['user', 'program' => function($query) {
                $query->select('id', 'client_id', 'title');
            }])
            ->whereHas('user', function ($query) {
                $query->where('role', 'client');
            })
            ->whereNotNull('program_id')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'comments' => $comments
        ]);
    }
}
