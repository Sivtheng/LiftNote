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
    };
    client: {
        name: string;
    };
    progress_logs: ProgressLog[];
}

interface ProgressLog {
    id: number;
    title: string;
    description: string;
    date: string;
}

const API_URL = 'http://localhost:8000/api';
const SANCTUM_COOKIE_URL = 'http://localhost:8000';

export default function ProgramListPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

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
        const fetchPrograms = async () => {
            if (!isAuthenticated) return;
            
            try {
                setIsLoading(true);
                setError('');

                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const xsrfToken = await getCsrfToken();
                const response = await fetch(`${API_URL}/programs/coach`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': xsrfToken
                    },
                    credentials: 'include',
                    mode: 'cors'
                });

                const data = await response.json();
                console.log('API Response:', data); // Debug log

                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                if (!data.programs) {
                    console.warn('No programs data in response:', data);
                    setPrograms([]);
                    return;
                }

                setPrograms(Array.isArray(data.programs) ? data.programs : []);
            } catch (error) {
                console.error('Error fetching programs:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch programs');
                setPrograms([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrograms();
    }, [isAuthenticated]);

    const handleDeleteProgram = async (programId: number) => {
        if (!confirm('Are you sure you want to delete this program?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${programId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete program');
            }

            setPrograms(programs.filter(program => program.id !== programId));
        } catch (error) {
            console.error('Error deleting program:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete program');
        }
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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-black">Program Management</h1>
                    <div className="space-x-4">
                        <button
                            onClick={() => router.push('/program/create')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Create New Program
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {!programs || programs.length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                        <p className="text-gray-500 mb-4">You haven't created any programs yet.</p>
                        <button
                            onClick={() => router.push('/program/create')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Create First Program
                        </button>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {programs.map((program) => (
                                    <tr key={program.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {program.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {program.client?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                program.status === 'active' ? 'bg-green-100 text-green-800' :
                                                program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {program.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {program.progress_logs?.length || 0} logs
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => router.push(`/program/${program.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => router.push(`/program/${program.id}/edit`)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProgram(program.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
} 