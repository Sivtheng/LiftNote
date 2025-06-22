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
use App\Services\MailService;
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
                'media_file' => 'nullable', // Allow both base64 and file uploads
                'parent_id' => 'nullable|exists:comments,id'
            ]);

            // Ensure either content or media file is provided
            if (empty($validated['content'] ?? '') && !$request->has('media_file') && !$request->hasFile('media_file')) {
                return response()->json([
                    'message' => 'Either content or media file is required',
                    'errors' => ['content' => ['Either content or media file is required.']]
                ], 422);
            }

            \Log::info('Validation passed', ['validated_data' => $validated]);

            $mediaUrl = null;
            $mediaType = 'text';
            
            // Handle both base64 file upload from React Native and regular file uploads from web
            if ($request->has('media_file') || $request->hasFile('media_file')) {
                if ($request->hasFile('media_file')) {
                    // Handle regular file upload (web FormData)
                    $file = $request->file('media_file');
                    $mediaType = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 'video';
                    $mediaUrl = $this->spacesService->uploadFile($file, 'comments');
                    \Log::info('Media file uploaded via FormData', ['media_url' => $mediaUrl]);
                } else if ($request->has('media_file')) {
                    // Handle base64 file upload from React Native
                    $mediaData = $request->input('media_file');
                    
                    // Add null check to prevent array_keys error
                    if ($mediaData === null) {
                        return response()->json([
                            'message' => 'Invalid media file format',
                            'errors' => ['media_file' => ['The media file field must be a valid file.']]
                        ], 422);
                    }
                    
                    \Log::info('Received media data:', array_keys($mediaData));
                    
                    // Check if it's base64 format (has data, type, name)
                    if (is_array($mediaData) && isset($mediaData['data']) && isset($mediaData['type']) && isset($mediaData['name'])) {
                        // Validate file type
                        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
                        if (!in_array($mediaData['type'], $allowedTypes)) {
                            return response()->json([
                                'message' => 'Invalid file type',
                                'errors' => ['media_file' => ['The media file must be a file of type: jpeg, png, jpg, gif, mp4, mov, avi.']]
                            ], 422);
                        }
                        
                        // Check file size (100MB limit for base64)
                        $base64Data = $mediaData['data'];
                        $fileSize = strlen($base64Data) * 3 / 4; // Approximate size of decoded base64
                        if ($fileSize > 100 * 1024 * 1024) {
                            return response()->json([
                                'message' => 'File too large',
                                'errors' => ['media_file' => ['The media file must be smaller than 100MB.']]
                            ], 422);
                        }
                        
                        // Decode base64 and create temporary file
                        $decodedData = base64_decode($base64Data);
                        $tempFile = tempnam(sys_get_temp_dir(), 'upload_');
                        file_put_contents($tempFile, $decodedData);
                        
                        // Create UploadedFile instance
                        $uploadedFile = new \Illuminate\Http\UploadedFile(
                            $tempFile,
                            $mediaData['name'],
                            $mediaData['type'],
                            null,
                            true
                        );
                        
                        // Upload to cloud storage
                        $mediaType = Str::startsWith($mediaData['type'], 'image/') ? 'image' : 'video';
                        $mediaUrl = $this->spacesService->uploadFile($uploadedFile, 'comments');
                        
                        // Clean up temp file
                        unlink($tempFile);
                        
                        \Log::info('Processed base64 media', [
                            'type' => $mediaType,
                            'original_type' => $mediaData['type'],
                            'file_size' => $fileSize,
                            'media_url' => $mediaUrl
                        ]);
                    } else {
                        return response()->json([
                            'message' => 'Invalid media file format',
                            'errors' => ['media_file' => ['The media file field must be a valid file.']]
                        ], 422);
                    }
                }
            }

            $comment = $program->comments()->create([
                'content' => $validated['content'] ?? null,
                'media_type' => $mediaType,
                'media_url' => $mediaUrl,
                'parent_id' => $validated['parent_id'] ?? null,
                'user_id' => Auth::id()
            ]);

            // Load the comment with user and replies relationships
            $comment->load('user');
            
            // Send email notification if coach is commenting on client's program
            $this->sendCommentNotification($comment, $program);
            
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
            'media_file' => 'nullable', // Allow both base64 and file uploads
        ]);

        $updateData = [
            'content' => $validated['content']
        ];
        
        // Handle both base64 file upload and regular file uploads
        if ($request->has('media_file') || $request->hasFile('media_file')) {
            // Delete old file if exists
            if ($comment->media_url) {
                $this->spacesService->deleteFile($comment->media_url);
            }

            if ($request->has('media_file')) {
                $mediaData = $request->input('media_file');
                
                // Check if it's base64 format (has data, type, name)
                if (is_array($mediaData) && isset($mediaData['data']) && isset($mediaData['type']) && isset($mediaData['name'])) {
                    // Validate file type
                    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
                    if (!in_array($mediaData['type'], $allowedTypes)) {
                        return response()->json([
                            'message' => 'Invalid file type',
                            'errors' => ['media_file' => ['The media file must be a file of type: jpeg, png, jpg, gif, mp4, mov, avi.']]
                        ], 422);
                    }
                    
                    // Check file size (100MB limit for base64)
                    $base64Data = $mediaData['data'];
                    $fileSize = strlen($base64Data) * 3 / 4; // Approximate size of decoded base64
                    if ($fileSize > 100 * 1024 * 1024) {
                        return response()->json([
                            'message' => 'File too large',
                            'errors' => ['media_file' => ['The media file must be smaller than 100MB.']]
                        ], 422);
                    }
                    
                    // Decode base64 and create temporary file
                    $decodedData = base64_decode($base64Data);
                    $tempFile = tempnam(sys_get_temp_dir(), 'upload_');
                    file_put_contents($tempFile, $decodedData);
                    
                    // Create UploadedFile instance
                    $uploadedFile = new \Illuminate\Http\UploadedFile(
                        $tempFile,
                        $mediaData['name'],
                        $mediaData['type'],
                        null,
                        true
                    );
                    
                    // Upload to cloud storage
                    $mediaType = Str::startsWith($mediaData['type'], 'image/') ? 'image' : 'video';
                    $mediaUrl = $this->spacesService->uploadFile($uploadedFile, 'comments');
                    
                    // Clean up temp file
                    unlink($tempFile);
                    
                    $updateData['media_type'] = $mediaType;
                    $updateData['media_url'] = $mediaUrl;
                }
            } else if ($request->hasFile('media_file')) {
                // Handle regular file upload (web)
                $file = $request->file('media_file');
                $mediaType = Str::startsWith($file->getMimeType(), 'image/') ? 'image' : 'video';
                $mediaUrl = $this->spacesService->uploadFile($file, 'comments');
                
                $updateData['media_type'] = $mediaType;
                $updateData['media_url'] = $mediaUrl;
            }
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

    private function loadNestedReplies($comment, $level = 0)
    {
        // Limit to 2 levels of replies
        if ($level >= 2) {
            return;
        }
        
        if ($comment->replies && $comment->replies->count() > 0) {
            $comment->replies->load(['user', 'parent.user']);
            $comment->replies->each(function ($reply) use ($level) {
                $this->loadNestedReplies($reply, $level + 1);
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

    /**
     * Send email notification for new comments/replies
     *
     * @param Comment $comment
     * @param Program $program
     * @return void
     */
    private function sendCommentNotification($comment, $program)
    {
        try {
            $user = Auth::user();
            
            // Only send notification if coach is commenting on client's program
            if (!$user->isCoach() && !$user->isAdmin()) {
                return;
            }
            
            // Get client information
            $client = $program->client;
            if (!$client) {
                \Log::warning('Client not found for program', ['program_id' => $program->id]);
                return;
            }
            
            // Don't send notification if coach is commenting on their own program
            if ($client->id === $user->id) {
                return;
            }
            
            $isReply = !empty($comment->parent_id);
            $commentContent = $comment->content ?: 'Media content';
            
            // Send email notification
            $emailSent = MailService::sendCommentNotification(
                $client->email,
                $client->name,
                $user->name,
                $program->title,
                $commentContent,
                $isReply
            );
            
            if ($emailSent) {
                \Log::info('Comment notification email sent', [
                    'comment_id' => $comment->id,
                    'client_email' => $client->email,
                    'is_reply' => $isReply
                ]);
            } else {
                \Log::error('Failed to send comment notification email', [
                    'comment_id' => $comment->id,
                    'client_email' => $client->email
                ]);
            }
            
        } catch (\Exception $e) {
            \Log::error('Error sending comment notification', [
                'comment_id' => $comment->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
