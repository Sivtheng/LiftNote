'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Client } from '@/types/client';
import { Program, Comment } from '@/types/program';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [error, setError] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);
    const [recentComments, setRecentComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch clients
                const clientsResponse = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                    headers: getAuthHeaders(token)
                });

                if (!clientsResponse.ok) {
                    throw new Error('Failed to fetch clients');
                }

                const clientsData = await clientsResponse.json();
                setClients(clientsData.users);

                // Fetch recent comments
                const commentsResponse = await fetch(`${API_CONFIG.BASE_URL}/comments/recent`, {
                    headers: getAuthHeaders(token)
                });

                if (!commentsResponse.ok) {
                    throw new Error('Failed to fetch recent comments');
                }

                const commentsData = await commentsResponse.json();
                setRecentComments(commentsData.comments);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchDashboardData();
        }
    }, [isAuthenticated]);

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-black mb-8">Dashboard</h1>
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    {/* Recent Comments Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Comments</h2>
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            {recentComments.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {recentComments.map((comment) => (
                                        <div key={comment.id} className="p-4 hover:bg-gray-50">
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
                                                            {new Date(comment.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <p className="mt-1 text-gray-700">{comment.content}</p>
                                                    {comment.media_type && comment.media_url && (
                                                        <div className="mt-2">
                                                            {comment.media_type === 'image' ? (
                                                                <img 
                                                                    src={comment.media_url} 
                                                                    alt="Comment media" 
                                                                    className="max-w-xs max-h-48 rounded-lg object-contain"
                                                                />
                                                            ) : comment.media_type === 'video' ? (
                                                                <video 
                                                                    src={comment.media_url} 
                                                                    controls 
                                                                    className="max-w-xs max-h-48 rounded-lg"
                                                                >
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                    {!comment.content && comment.media_type && comment.media_url && (
                                                        <p className="mt-1 text-gray-500 italic">
                                                            {comment.media_type === 'image' ? '📷 Image' : '🎥 Video'}
                                                        </p>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/client/${comment.program.client_id}/comments/${comment.program_id}`)}
                                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        View Comment Thread
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    No recent comments
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Progress Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Client Progress</h2>
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            {clients.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {clients.map((client) => (
                                        <div key={client.id} className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-xl font-medium text-indigo-600">
                                                                {client.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                                                        <p className="text-sm text-gray-500">{client.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    {client.current_program?.id ? (
                                                        <>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {client.current_program.title}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    Started {new Date(client.current_program.created_at).toLocaleDateString()}
                                                                </p>
                                                                <div className="mt-2">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-sm font-medium text-gray-700">Progress</span>
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            {Math.round((client.current_program.completed_weeks / client.current_program.total_weeks) * 100)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${(client.current_program.completed_weeks / client.current_program.total_weeks) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-gray-500">
                                                                        {client.current_program.completed_weeks} of {client.current_program.total_weeks} weeks completed
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => router.push(`/program/${client.current_program!.id}`)}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                            >
                                                                View Program
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => router.push(`/program/create?client_id=${client.id}`)}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            Create Program
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-gray-500">
                                    No clients found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 