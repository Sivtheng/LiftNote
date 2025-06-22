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
    const [selectedPrograms, setSelectedPrograms] = useState<{ [clientId: number]: number }>({});

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

                // Set default selected programs (latest program for each client)
                const defaultSelections: { [clientId: number]: number } = {};
                clientsData.users.forEach((client: Client) => {
                    if (client.client_programs && client.client_programs.length > 0) {
                        defaultSelections[client.id] = client.client_programs[0].id;
                    }
                });
                setSelectedPrograms(defaultSelections);

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

    const handleProgramChange = (clientId: number, programId: number) => {
        setSelectedPrograms((prev: { [clientId: number]: number }) => ({
            ...prev,
            [clientId]: programId
        }));
    };

    const getSelectedProgram = (client: Client) => {
        if (!client.client_programs || client.client_programs.length === 0) {
            return null;
        }
        
        const selectedProgramId = selectedPrograms[client.id];
        if (selectedProgramId) {
            return client.client_programs.find(p => p.id === selectedProgramId) || client.client_programs[0];
        }
        
        return client.client_programs[0];
    };

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
                                                    {comment.user.profile_picture ? (
                                                        <img
                                                            src={comment.user.profile_picture}
                                                            alt={comment.user.name + "'s profile"}
                                                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-lg font-medium text-indigo-600">
                                                                {comment.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
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
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Client
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Program
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Progress
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clients.map((client) => {
                                                const selectedProgram = getSelectedProgram(client);
                                                return (
                                                    <tr key={client.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    {client.profile_picture ? (
                                                                        <img
                                                                            src={client.profile_picture}
                                                                            alt={client.name + "'s profile"}
                                                                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                            <span className="text-sm font-medium text-indigo-600">
                                                                                {client.name.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {client.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {client.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {client.client_programs && client.client_programs.length > 0 ? (
                                                                <div>
                                                                    {/* Program Selector */}
                                                                    {client.client_programs.length > 1 && (
                                                                        <div className="mb-2">
                                                                            <select
                                                                                value={selectedProgram?.id || ''}
                                                                                onChange={(e) => handleProgramChange(client.id, Number(e.target.value))}
                                                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                                            >
                                                                                {client.client_programs.map((program) => (
                                                                                    <option key={program.id} value={program.id}>
                                                                                        {program.title}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {selectedProgram?.title || 'No Program'}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        Started {selectedProgram ? new Date(selectedProgram.created_at).toLocaleDateString() : 'N/A'}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500">
                                                                    No programs assigned
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {selectedProgram ? (
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            {Math.round((selectedProgram.completed_weeks || 0) / (selectedProgram.total_weeks || 1) * 100)}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${(selectedProgram.completed_weeks || 0) / (selectedProgram.total_weeks || 1) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {selectedProgram.completed_weeks || 0} of {selectedProgram.total_weeks || 0} weeks
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500">
                                                                    N/A
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {selectedProgram ? (
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    selectedProgram.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                    selectedProgram.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {selectedProgram.status}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    No Program
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            {selectedProgram ? (
                                                                <button
                                                                    onClick={() => router.push(`/program/${selectedProgram.id}`)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                >
                                                                    View Program
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => router.push(`/program/create?client_id=${client.id}`)}
                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                >
                                                                    Create Program
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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