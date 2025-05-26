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
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

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

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.content.trim()) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/programs/${programId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newComment)
            });

            if (!response.ok) {
                throw new Error('Failed to post comment');
            }

            const data = await response.json();
            setComments(prev => [...prev, data.comment]);
            setNewComment({
                content: '',
                media_type: 'text',
                media_url: '',
                parent_id: null
            });
            setReplyingTo(null);
        } catch (error) {
            console.error('Error posting comment:', error);
            setError(error instanceof Error ? error.message : 'Failed to post comment');
        }
    };

    const handleReply = (commentId: number) => {
        setReplyingTo(commentId);
        setNewComment(prev => ({
            ...prev,
            parent_id: commentId
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
                        <p className="text-sm font-medium text-gray-900">{comment.user.name}</p>
                        <p className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                        </p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments</h2>
                    
                    {/* Comment Form */}
                    <form onSubmit={handleSubmitComment} className="mb-8">
                        <div className="bg-white rounded-lg shadow p-4">
                            <textarea
                                value={newComment.content}
                                onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={3}
                            />
                            <div className="mt-4 flex justify-between items-center">
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="text"
                                            checked={newComment.media_type === 'text'}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, media_type: e.target.value as 'text' | 'video' | 'image' }))}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span className="ml-2">Text</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="image"
                                            checked={newComment.media_type === 'image'}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, media_type: e.target.value as 'text' | 'video' | 'image' }))}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span className="ml-2">Image</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="video"
                                            checked={newComment.media_type === 'video'}
                                            onChange={(e) => setNewComment(prev => ({ ...prev, media_type: e.target.value as 'text' | 'video' | 'image' }))}
                                            className="form-radio text-indigo-600"
                                        />
                                        <span className="ml-2">Video</span>
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    {replyingTo ? 'Reply' : 'Comment'}
                                </button>
                            </div>
                            {newComment.media_type !== 'text' && (
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        value={newComment.media_url}
                                        onChange={(e) => setNewComment(prev => ({ ...prev, media_url: e.target.value }))}
                                        placeholder={`Enter ${newComment.media_type} URL`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments.map(comment => renderComment(comment))}
                    </div>
                </div>
            </div>
        </div>
    );
} 