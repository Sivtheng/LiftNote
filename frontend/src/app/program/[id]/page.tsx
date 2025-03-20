'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Program {
    id: number;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'cancelled';
    coach_id: number;
    client_id: number;
    coach: {
        name: string;
        email: string;
    };
    client: {
        name: string;
        email: string;
    };
    progress_logs: ProgressLog[];
    comments: Comment[];
}

interface ProgressLog {
    id: number;
    title: string;
    description: string;
    date: string;
    comments: Comment[];
}

interface Comment {
    id: number;
    content: string;
    user: {
        name: string;
    };
    created_at: string;
}

const API_URL = 'http://localhost:8000/api';
const SANCTUM_COOKIE_URL = 'http://localhost:8000';

export default function ProgramDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [program, setProgram] = useState<Program | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [newComment, setNewComment] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'comments'>('details');

    const getCsrfToken = async () => {
        try {
            const response = await fetch(`${SANCTUM_COOKIE_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch CSRF token: ${response.status}`);
            }

            const xsrfToken = document.cookie
                .split(';')
                .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            if (!xsrfToken) {
                throw new Error('XSRF-TOKEN cookie not set');
            }

            return decodeURIComponent(xsrfToken);
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            throw error;
        }
    };

    useEffect(() => {
        const fetchProgram = async () => {
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const xsrfToken = await getCsrfToken();
                const response = await fetch(`${API_URL}/programs/${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': xsrfToken
                    },
                    credentials: 'include',
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch program details');
                }

                const data = await response.json();
                setProgram(data.program);
            } catch (error) {
                console.error('Error fetching program:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch program details');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchProgram();
        }
    }, [isAuthenticated, params.id]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${params.id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ content: newComment })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            const data = await response.json();
            setProgram(prev => prev ? {
                ...prev,
                comments: [...prev.comments, data.comment]
            } : null);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            setError(error instanceof Error ? error.message : 'Failed to add comment');
        }
    };

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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-black">{program.title}</h1>
                    <div className="space-x-4">
                        <button
                            onClick={() => router.push(`/program/${params.id}/edit`)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Edit Program
                        </button>
                        <button
                            onClick={() => router.push('/program')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Back to Programs
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`${
                                    activeTab === 'details'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setActiveTab('progress')}
                                className={`${
                                    activeTab === 'progress'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                            >
                                Progress Logs
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`${
                                    activeTab === 'comments'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                            >
                                Comments
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Program Details</h3>
                                    <div className="mt-2 text-sm text-gray-500">{program.description}</div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Status</h4>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        program.status === 'active' ? 'bg-green-100 text-green-800' :
                                        program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {program.status}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Client</h4>
                                    <div className="mt-2 text-sm text-gray-500">
                                        <p>{program.client.name}</p>
                                        <p>{program.client.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div className="space-y-6">
                                {program.progress_logs.length > 0 ? (
                                    program.progress_logs.map((log) => (
                                        <div key={log.id} className="border-b border-gray-200 pb-6">
                                            <h3 className="text-lg font-medium text-gray-900">{log.title}</h3>
                                            <p className="mt-2 text-sm text-gray-500">{log.description}</p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {new Date(log.date).toLocaleDateString()}
                                            </p>
                                            {log.comments.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {log.comments.map((comment) => (
                                                        <div key={comment.id} className="text-sm text-gray-600">
                                                            <span className="font-medium">{comment.user.name}: </span>
                                                            {comment.content}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No progress logs yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {program.comments.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900">{comment.content}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {comment.user.name} - {new Date(comment.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleAddComment} className="mt-6">
                                    <div>
                                        <label htmlFor="comment" className="sr-only">Add comment</label>
                                        <textarea
                                            id="comment"
                                            rows={3}
                                            className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Add Comment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 