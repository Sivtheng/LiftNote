'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Program, Comment } from '@/types/program';
import Navbar from '../../../../components/Navbar';

const API_URL = 'http://localhost:8000/api';

export default function CommentsPage({ params }: { params: Promise<{ id: string; programId: string }> }) {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [program, setProgram] = useState<Program | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [newComment, setNewComment] = useState({
        content: '',
        media_type: 'text' as 'text' | 'video' | 'image',
        media_url: '',
        parent_id: null as number | null
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { id, programId } = use(params);

    useEffect(() => {
        const fetchProgramData = async () => {
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch program details
                const programResponse = await fetch(`${API_URL}/programs/${programId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include'
                });

                if (!programResponse.ok) {
                    throw new Error('Failed to fetch program details');
                }

                const programData = await programResponse.json();
                setProgram(programData.program);

                // Fetch comments
                const commentsResponse = await fetch(`${API_URL}/programs/${programId}/comments`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include'
                });

                if (!commentsResponse.ok) {
                    throw new Error('Failed to fetch comments');
                }

                const commentsData = await commentsResponse.json();
                setComments(commentsData.comments);
            } catch (error) {
                console.error('Error fetching program data:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch program data');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchProgramData();
        }
    }, [isAuthenticated, programId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) {
            setError('Only image and video files are allowed');
            return;
        }

        setSelectedFile(file);
        setNewComment(prev => ({
            ...prev,
            media_type: isImage ? 'image' : 'video'
        }));

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleRemoveFile = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        setNewComment(prev => ({
            ...prev,
            media_type: 'text',
            media_url: ''
        }));
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.content.trim() && !selectedFile) return;

        try {
            setIsSubmitting(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            formData.append('content', newComment.content);
            if (selectedFile) {
                formData.append('media_file', selectedFile);
            }
            if (newComment.parent_id) {
                formData.append('parent_id', newComment.parent_id.toString());
            }

            const response = await fetch(`${API_URL}/programs/${programId}/comments`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            const data = await response.json();
            
            if (newComment.parent_id) {
                setComments((prev: Comment[]) => prev.map((comment: Comment) => {
                    if (comment.id === newComment.parent_id) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), data.comment]
                        };
                    }
                    return comment;
                }));
            } else {
                setComments((prev: Comment[]) => [data.comment, ...prev]);
            }

            setNewComment({
                content: '',
                media_type: 'text',
                media_url: '',
                parent_id: null
            });
            setSelectedFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setReplyingTo(null);
        } catch (error) {
            console.error('Error posting comment:', error);
            setError(error instanceof Error ? error.message : 'Failed to post comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = (commentId: number) => {
        setReplyingTo(commentId);
        setNewComment((prev) => ({
            ...prev,
            parent_id: commentId
        }));
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setNewComment((prev) => ({
            ...prev,
            parent_id: null
        }));
    };

    const renderComment = (comment: Comment) => (
        <div key={comment.id} className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-lg font-medium text-indigo-600">
                            {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{comment.user.name}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                comment.user.role === 'coach' ? 'bg-blue-100 text-blue-800' :
                                comment.user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {comment.user.role}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {new Date(comment.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <p className="mt-1 text-gray-700">{comment.content}</p>
                    {comment.media_url && (
                        <div className="mt-2">
                            {comment.media_type === 'image' ? (
                                <img src={comment.media_url} alt="Comment media" className="max-w-sm rounded-lg" />
                            ) : comment.media_type === 'video' ? (
                                <video src={comment.media_url} controls className="max-w-sm rounded-lg" />
                            ) : null}
                        </div>
                    )}
                    <div className="mt-2">
                        <button
                            onClick={() => handleReply(comment.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                            Reply
                        </button>
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-8 space-y-4">
                            {comment.replies.map(reply => renderComment(reply))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated || !program) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Program Header */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{program.title}</h1>
                                <p className="mt-1 text-gray-600">{program.description}</p>
                            </div>
                            <button
                                onClick={() => router.back()}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-black mb-6">Comments</h2>
                    
                    {/* Comment Form */}
                    <form onSubmit={handleSubmitComment} className="bg-white rounded-lg shadow p-4 mb-8 text-black">
                        <div className="mb-4">
                            <textarea
                                value={newComment.content}
                                onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Write a comment..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                            />
                        </div>
                        
                        {/* File Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add Media (Optional)
                            </label>
                            <div className="flex items-center space-x-4">
                                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Choose File
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-sm text-red-600 hover:text-red-800"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            {selectedFile && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>

                        {/* Preview */}
                        {previewUrl && (
                            <div className="mb-4">
                                {newComment.media_type === 'image' ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-48 rounded-lg"
                                    />
                                ) : (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="max-h-48 rounded-lg"
                                    />
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            {replyingTo ? (
                                <button
                                    type="button"
                                    onClick={handleCancelReply}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Cancel Reply
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting || (!newComment.content.trim() && !selectedFile)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Posting...' : replyingTo ? 'Reply' : 'Post Comment'}
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments.length > 0 ? (
                            comments.map(comment => renderComment(comment))
                        ) : (
                            <div className="text-center py-8 bg-white rounded-lg shadow">
                                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 