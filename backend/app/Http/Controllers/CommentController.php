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
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CommentController extends Controller
{
    use AuthorizesRequests;

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
        try {
            \Log::info('Comment store method called', [
                'program_id' => $program->id,
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            // Verify user has access to this program
            $user = Auth::user();
            if (!$user->isAdmin() && 
                $program->coach_id !== $user->id && 
                $program->client_id !== $user->id) {
                \Log::warning('Unauthorized comment attempt', [
                    'user_id' => $user->id,
                    'program_coach_id' => $program->coach_id,
                    'program_client_id' => $program->client_id
                ]);
                return response()->json([
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'content' => 'nullable|string|max:1000',
                'media_type' => ['nullable', Rule::in(['text', 'image', 'video'])],
                'media_file' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:10240', // 10MB max
                'parent_id' => 'nullable|exists:comments,id'
            ]);

            // Ensure either content or media file is provided
            if (empty($validated['content']) && !$request->hasFile('media_file')) {
                return response()->json([
                    'message' => 'Either content or media file is required',
                    'errors' => ['content' => ['Either content or media file is required.']]
                ], 422);
            }

            \Log::info('Validation passed', ['validated_data' => $validated]);

            $mediaUrl = null;
            $mediaType = 'text';
            
            if ($request->hasFile('media_file')) {
                $file = $request->file('media_file');
                $mediaType = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 'video';
                $mediaUrl = $this->spacesService->uploadFile($file, 'comments');
                \Log::info('Media file uploaded', ['media_url' => $mediaUrl]);
            }

            $comment = $program->comments()->create([
                'content' => $validated['content'],
                'media_type' => $mediaType,
                'media_url' => $mediaUrl,
                'parent_id' => $validated['parent_id'] ?? null,
                'user_id' => Auth::id()
            ]);

            // Load the comment with user and replies relationships
            $comment->load('user');
            
            // If this is a reply, load the parent comment's replies to maintain structure
            if ($comment->parent_id) {
                $parentComment = Comment::with(['user', 'replies.user'])->find($comment->parent_id);
                if ($parentComment) {
                    $this->loadNestedReplies($parentComment);
                    // Return the parent comment instead so frontend can update properly
                    return response()->json([
                        'message' => 'Comment created successfully',
                        'comment' => $parentComment
                    ], 201);
                }
            }

            \Log::info('Comment created successfully', ['comment_id' => $comment->id]);

            return response()->json([
                'message' => 'Comment created successfully',
                'comment' => $comment
            ], 201);
        } catch (ModelNotFoundException $e) {
            \Log::error('Program not found', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Program not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating comment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error creating comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'media_file' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:10240', // 10MB max
        ]);

        $updateData = [
            'content' => $validated['content']
        ];
        
        // Only update media if a new file is provided
        if ($request->hasFile('media_file')) {
            // Delete old file if exists
            if ($comment->media_url) {
                $this->spacesService->deleteFile($comment->media_url);
            }

            $file = $request->file('media_file');
            $mediaType = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 'video';
            $mediaUrl = $this->spacesService->uploadFile($file, 'comments');
            
            $updateData['media_type'] = $mediaType;
            $updateData['media_url'] = $mediaUrl;
        }

        $comment->update($updateData);

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment
        ]);
    }

    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        \Log::info('Deleting comment', [
            'comment_id' => $comment->id,
            'has_media' => !empty($comment->media_url),
            'media_url' => $comment->media_url
        ]);

        // Delete associated file if exists
        if ($comment->media_url) {
            \Log::info('Attempting to delete media file', [
                'comment_id' => $comment->id,
                'media_url' => $comment->media_url
            ]);
            $this->spacesService->deleteFile($comment->media_url);
        }

        $comment->delete();

        \Log::info('Comment deleted successfully', [
            'comment_id' => $comment->id
        ]);

        return response()->json([
            'message' => 'Comment deleted successfully'
        ]);
    }

    // Add comment to a program
    public function addProgramComment(Request $request, Program $program)
    {
        return $this->store($request, $program);
    }

    // Update a program comment
    public function updateProgramComment(Request $request, Program $program, Comment $comment)
    {
        try {
            // Verify the comment belongs to this program
            if ($comment->program_id !== $program->id) {
                return response()->json(['message' => 'Comment not found'], 404);
            }

            // Use the policy for authorization instead of manual checks
            $this->authorize('update', $comment);

            return $this->update($request, $comment);
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
        \Log::info('deleteProgramComment called', [
            'program_id' => $program->id,
            'comment_id' => $comment->id,
            'user_id' => Auth::id()
        ]);

        try {
            // Verify the comment belongs to this program
            if ($comment->program_id !== $program->id) {
                \Log::warning('Comment does not belong to program', [
                    'comment_program_id' => $comment->program_id,
                    'requested_program_id' => $program->id
                ]);
                return response()->json([
                    'message' => 'Comment not found'
                ], 404);
            }

            \Log::info('About to authorize delete');
            // Use the policy for authorization instead of manual checks
            $this->authorize('delete', $comment);

            \Log::info('Authorization passed, calling destroy');
            return $this->destroy($comment);
        } catch (\Exception $e) {
            \Log::error('Error in deleteProgramComment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error deleting comment',
                'error' => $e->getMessage()
            ], 500);
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

            $query = Comment::where('program_id', $program->id)
                ->whereNull('parent_id')
                ->with(['user', 'replies.user']);

            // Filter by role if specified
            if (request()->has('role') && request('role') === 'coach') {
                $query->whereHas('user', function ($userQuery) {
                    $userQuery->whereIn('role', ['coach', 'admin']);
                });
            }

            $comments = $query->orderBy('created_at', 'desc')->get();

            // Manually load nested replies for each comment
            $comments->each(function ($comment) {
                $this->loadNestedReplies($comment);
            });

            return response()->json([
                'comments' => $comments
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching comments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function loadNestedReplies($comment)
    {
        if ($comment->replies && $comment->replies->count() > 0) {
            $comment->replies->load(['user', 'parent.user']);
            $comment->replies->each(function ($reply) {
                $this->loadNestedReplies($reply);
            });
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
