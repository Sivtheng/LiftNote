'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types/client';
import Navbar from '../../components/Navbar';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

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
        total_weeks: 0,
    });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                    headers: getAuthHeaders(token)
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/users/${formData.client_id}`, {
                method: 'POST',
                headers: getAuthHeaders(token),
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    status: 'active',
                    total_weeks: formData.total_weeks
                })
            });

            if (!response.ok) {
                const data = await response.json();
                console.error('Server response:', data);
                throw new Error(data.message || data.error || 'Failed to create program');
            }

            const data = await response.json();
            router.push(`/program/${data.program.id}`);
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900">Program Builder</h1>
                    <p className="mt-3 text-lg text-gray-600">Basic Program Information</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <div className="p-12">
                        <form onSubmit={handleSubmit} className="space-y-12">
                            <div>
                                <label htmlFor="title" className="block text-lg font-medium text-gray-900 mb-2">
                                    Name your program
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="client" className="block text-lg font-medium text-gray-900 mb-2">
                                    Select Client
                                </label>
                                <select
                                    id="client"
                                    value={formData.client_id}
                                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-lg"
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
                                <label htmlFor="description" className="block text-lg font-medium text-gray-900 mb-2">
                                    Program Description
                                </label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={6}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="total_weeks" className="block text-lg font-medium text-gray-900 mb-2">
                                    Program Duration (weeks)
                                </label>
                                <input
                                    type="text"
                                    id="total_weeks"
                                    value={formData.total_weeks || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow numbers
                                        if (value === '' || /^\d+$/.test(value)) {
                                            const numValue = value === '' ? 0 : parseInt(value);
                                            if (numValue >= 1 && numValue <= 52) {
                                                setFormData({ ...formData, total_weeks: numValue });
                                            } else if (value === '') {
                                                setFormData({ ...formData, total_weeks: 0 });
                                            }
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (isNaN(value) || value < 1) {
                                            setFormData({ ...formData, total_weeks: 1 });
                                        } else if (value > 52) {
                                            setFormData({ ...formData, total_weeks: 52 });
                                        }
                                    }}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-lg"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-6 pt-8 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => router.push('/program')}
                                    className="px-8 py-3 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Next Step
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
} 