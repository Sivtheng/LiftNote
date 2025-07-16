'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Program, ProgressLog, ProgramWeek, Comment } from '@/types/program';
import Navbar from '../components/Navbar';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface Client {
    id: number;
    name: string;
    email: string;
    role: string;
}

export default function ProgramListPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

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

                const response = await fetch(`${API_CONFIG.BASE_URL}/programs/coach`, {
                    headers: getAuthHeaders(token)
                });

                const data = await response.json();

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

        const fetchClients = async () => {
            if (!isAuthenticated) return;
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`${API_CONFIG.BASE_URL}/users`, {
                    headers: getAuthHeaders(token)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                if (data.users) {
                    setClients(data.users);
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
                // Don't set error for clients fetch failure as it's not critical
            }
        };

        fetchPrograms();
        fetchClients();
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${programId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(token)
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

    const handleDuplicateProgram = async (programId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${programId}/duplicate`, {
                method: 'POST',
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to duplicate program');
            }

            const data = await response.json();
            
            // Add the new duplicated program to the list
            setPrograms((prevPrograms: Program[]) => [data.program, ...prevPrograms]);
        } catch (error) {
            console.error('Error duplicating program:', error);
            setError(error instanceof Error ? error.message : 'Failed to duplicate program');
        }
    };

    const handleAssignClient = async (programId: number, clientId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${programId}/assign-client`, {
                method: 'POST',
                headers: getAuthHeaders(token),
                body: JSON.stringify({ client_id: clientId })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to assign client');
            }

            const data = await response.json();
            
            // Update the program in the list
            setPrograms((prevPrograms: Program[]) => 
                prevPrograms.map((program: Program) => 
                    program.id === programId 
                        ? data.program 
                        : program
                )
            );
        } catch (error) {
            console.error('Error assigning client:', error);
            setError(error instanceof Error ? error.message : 'Failed to assign client');
        }
    };

    const handleStatusChange = async (programId: number, newStatus: 'active' | 'completed') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${programId}`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify({
                    status: newStatus,
                    title: programs.find((p: Program) => p.id === programId)?.title || '',
                    description: programs.find((p: Program) => p.id === programId)?.description || ''
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update program status');
            }

            // Update the program status in the local state
            setPrograms(programs.map((program: Program) => 
                program.id === programId 
                    ? { ...program, status: newStatus }
                    : program
            ));
        } catch (error) {
            console.error('Error updating program status:', error);
            setError(error instanceof Error ? error.message : 'Failed to update program status');
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'completed':
                return (
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create Program Card */}
                    <div 
                        onClick={() => router.push('/program/create')}
                        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    >
                        <div className="h-48 bg-indigo-100 flex items-center justify-center">
                            <svg className="w-24 h-24 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-medium text-gray-900">Create New Program</h3>
                            <p className="mt-2 text-sm text-gray-500">Click to create a new program for your client</p>
                        </div>
                    </div>

                    {/* Program Cards */}
                    {programs.map((program) => (
                        <div 
                            key={program.id} 
                            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                        >
                            <div 
                                onClick={() => router.push(`/program/${program.id}`)}
                                className="h-48 bg-gray-100 flex items-center justify-center cursor-pointer"
                            >
                                {getStatusIcon(program.status)}
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-medium text-gray-900">{program.title}</h3>
                                    <div className="relative">
                                        <select
                                            value={program.status}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(program.id, e.target.value as 'active' | 'completed');
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`text-sm font-medium rounded-full px-2.5 py-0.5 cursor-pointer ${
                                                program.status === 'active' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Client: {program.client?.name || 'No client assigned'}
                                </p>
                                
                                {/* Client Assignment Dropdown for unassigned programs */}
                                {!program.client_id && (
                                    <div className="mt-3">
                                        <select
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                if (e.target.value) {
                                                    handleAssignClient(program.id, parseInt(e.target.value));
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Assign to client...</option>
                                            {clients.map((client) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <div className="mt-4 flex justify-between items-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateProgram(program.id);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        Duplicate
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProgram(program.id);
                                        }}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {programs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Created</h3>
                        <p className="text-gray-500">Click the "Create New Program" card to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 