'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Client {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
}

interface Program {
    id: number;
    title: string;
    description: string;
    status: string;
    coach_id: number;
    client_id: number;
    progress_logs: ProgressLog[];
    comments: Comment[];
}

interface ProgressLog {
    id: number;
    title: string;
    description: string;
    date: string;
    client_id: number;
    program_id: number;
    comments: Comment[];
}

interface Comment {
    id: number;
    content: string;
    user_id: number;
    program_id?: number;
    progress_log_id?: number;
    user: {
        name: string;
    };
}

interface Questionnaire {
    id: number;
    client_id: number;
    status: string;
    answers: Record<string, string>;
}

const API_URL = 'http://localhost:8000/api';

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'profile' | 'questionnaire' | 'programs' | 'progress'>('profile');

    const { id } = use(params);

    useEffect(() => {
        const fetchClientData = async () => {
            try {
                setIsLoading(true);
                setError('');
                const clientId = parseInt(id);

                // Get the token
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch client details
                const clientResponse = await fetch(`${API_URL}/users/${clientId}`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!clientResponse.ok) {
                    const errorData = await clientResponse.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to fetch client details');
                }

                const clientData = await clientResponse.json();
                setClient(clientData.user);

                // Fetch client's questionnaire
                const questionnaireResponse = await fetch(`${API_URL}/questionnaires/users/${clientId}`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (questionnaireResponse.ok) {
                    const questionnaireData = await questionnaireResponse.json();
                    setQuestionnaire(questionnaireData.questionnaire);
                }

                // Fetch client's programs
                const programsResponse = await fetch(`${API_URL}/programs/coach`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!programsResponse.ok) {
                    const errorData = await programsResponse.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to fetch programs');
                }

                const programsData = await programsResponse.json();
                setPrograms(programsData.programs.filter((p: Program) => p.client_id === clientId));
            } catch (error) {
                console.error('Error fetching client data:', error);
                setError(error instanceof Error ? error.message : 'Failed to fetch client data');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchClientData();
        }
    }, [isAuthenticated, id]);

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated || !client) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-black">Client Details</h1>
                    <div className="space-x-4">
                        <button
                            onClick={() => router.push('/client')}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Back to Clients
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

                {/* Client Profile Section */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center">
                        {client.profile_picture && (
                            <img
                                src={client.profile_picture}
                                alt={client.name}
                                className="h-20 w-20 rounded-full"
                            />
                        )}
                        <div className="ml-6">
                            <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                            <p className="text-gray-600">{client.email}</p>
                            {client.phone_number && (
                                <p className="text-gray-600">{client.phone_number}</p>
                            )}
                            {client.bio && (
                                <p className="mt-2 text-gray-700">{client.bio}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`${
                                activeTab === 'profile'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('questionnaire')}
                            className={`${
                                activeTab === 'questionnaire'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Questionnaire
                        </button>
                        <button
                            onClick={() => setActiveTab('programs')}
                            className={`${
                                activeTab === 'programs'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Programs
                        </button>
                        <button
                            onClick={() => setActiveTab('progress')}
                            className={`${
                                activeTab === 'progress'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Progress
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="bg-white shadow rounded-lg p-6">
                    {activeTab === 'profile' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <p className="mt-1 text-sm text-gray-900">{client.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <p className="mt-1 text-sm text-gray-900">{client.email}</p>
                                </div>
                                {client.phone_number && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <p className="mt-1 text-sm text-gray-900">{client.phone_number}</p>
                                    </div>
                                )}
                                {client.bio && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                                        <p className="mt-1 text-sm text-gray-900">{client.bio}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'questionnaire' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Questionnaire Responses</h3>
                            {questionnaire ? (
                                <div className="space-y-4">
                                    {Object.entries(questionnaire.answers).map(([key, value]) => (
                                        <div key={key} className="border-b border-gray-200 pb-4">
                                            <label className="block text-sm font-medium text-gray-700">{key}</label>
                                            <p className="mt-1 text-sm text-gray-900">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Questionnaire Responses</h4>
                                    <p className="text-gray-500">This client hasn't completed the questionnaire yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'programs' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Programs</h3>
                            {programs.length > 0 ? (
                                <div className="space-y-4">
                                    {programs.map((program) => (
                                        <div key={program.id} className="border rounded-lg p-4">
                                            <h4 className="text-lg font-medium text-gray-900">{program.title}</h4>
                                            <p className="mt-1 text-sm text-gray-600">{program.description}</p>
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    program.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {program.status}
                                                </span>
                                            </div>
                                            {program.comments.length > 0 && (
                                                <div className="mt-4">
                                                    <h5 className="text-sm font-medium text-gray-900">Comments</h5>
                                                    <div className="mt-2 space-y-2">
                                                        {program.comments.map((comment) => (
                                                            <div key={comment.id} className="text-sm">
                                                                <span className="font-medium">{comment.user.name}: </span>
                                                                {comment.content}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Programs Created</h4>
                                    <p className="text-gray-500">This client doesn't have any programs yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'progress' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Logs</h3>
                            {programs.length > 0 ? (
                                <div className="space-y-4">
                                    {programs.map((program) => (
                                        <div key={program.id}>
                                            <h4 className="text-md font-medium text-gray-900 mb-2">{program.title}</h4>
                                            {program.progress_logs.length > 0 ? (
                                                <div className="space-y-4">
                                                    {program.progress_logs.map((log) => (
                                                        <div key={log.id} className="border rounded-lg p-4">
                                                            <h5 className="text-sm font-medium text-gray-900">{log.title}</h5>
                                                            <p className="mt-1 text-sm text-gray-600">{log.description}</p>
                                                            <p className="mt-1 text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</p>
                                                            {log.comments.length > 0 && (
                                                                <div className="mt-2">
                                                                    <h6 className="text-sm font-medium text-gray-900">Comments</h6>
                                                                    <div className="mt-1 space-y-1">
                                                                        {log.comments.map((comment) => (
                                                                            <div key={comment.id} className="text-sm">
                                                                                <span className="font-medium">{comment.user.name}: </span>
                                                                                {comment.content}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-sm text-gray-500">No progress logs found for this program.</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Progress Data</h4>
                                    <p className="text-gray-500">This client doesn't have any programs or progress logs yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 