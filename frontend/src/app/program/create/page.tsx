'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types/client';

const API_URL = 'http://localhost:8000/api';
const SANCTUM_COOKIE_URL = 'http://localhost:8000';

export default function CreateProgramPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        client_id: '',
        status: 'active'
    });

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
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const xsrfToken = await getCsrfToken();
                const response = await fetch(`${API_URL}/users`, {
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
                    throw new Error('Failed to fetch clients');
                }

                const data = await response.json();
                // Filter only clients from the users list
                setClients(data.users.filter((user: any) => user.role === 'client'));
            } catch (error) {
                console.error('Error fetching clients:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch clients');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchClients();
        }
    }, [isAuthenticated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/users/${formData.client_id}`, {
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
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    status: formData.status
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create program');
            }

            router.push('/program');
        } catch (error) {
            console.error('Error creating program:', error);
            setError(error instanceof Error ? error.message : 'Failed to create program');
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
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-black">Create New Program</h1>
                    <button
                        onClick={() => router.push('/program')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Back to Programs
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Client</label>
                            <select
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Select a client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Create Program
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
} 