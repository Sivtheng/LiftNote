'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types/client';
import { Program, ProgressLog, Comment } from '@/types/program';
import { Questionnaire } from '@/types/client';
import Navbar from '../../components/Navbar';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'programs' | 'questionnaire' | 'progress-logs'>('programs');

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
                const clientResponse = await fetch(`${API_CONFIG.BASE_URL}/users/${clientId}`, {
                    headers: getAuthHeaders(token)
                });

                if (!clientResponse.ok) {
                    const errorData = await clientResponse.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to fetch client details');
                }

                const clientData = await clientResponse.json();
                setClient(clientData.user);

                // Fetch client's questionnaire
                const questionnaireResponse = await fetch(`${API_CONFIG.BASE_URL}/questionnaires/users/${clientId}`, {
                    headers: getAuthHeaders(token)
                });

                if (questionnaireResponse.ok) {
                    const questionnaireData = await questionnaireResponse.json();
                    setQuestionnaire(questionnaireData.questionnaire);
                }

                // Fetch client's programs
                const programsResponse = await fetch(`${API_CONFIG.BASE_URL}/programs/coach`, {
                    headers: getAuthHeaders(token)
                });

                if (!programsResponse.ok) {
                    const errorData = await programsResponse.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to fetch programs');
                }

                const programsData = await programsResponse.json();
                const clientPrograms = programsData.programs.filter((p: Program) => p.client_id === clientId);
                setPrograms(clientPrograms);

                // Fetch progress logs for all client's programs
                const allProgressLogs: ProgressLog[] = [];
                console.log('Fetching progress logs for programs:', clientPrograms.map(p => ({ id: p.id, title: p.title })));
                
                for (const program of clientPrograms) {
                    try {
                        console.log(`Fetching progress logs for program ${program.id} (${program.title})`);
                        const progressResponse = await fetch(`${API_CONFIG.BASE_URL}/programs/${program.id}/progress/coach`, {
                            headers: getAuthHeaders(token)
                        });
                        
                        console.log(`Progress response status for program ${program.id}:`, progressResponse.status);
                        
                        if (progressResponse.ok) {
                            const progressData = await progressResponse.json();
                            console.log(`Progress data for program ${program.id}:`, progressData);
                            allProgressLogs.push(...progressData.logs);
                        } else {
                            const errorText = await progressResponse.text();
                            console.error(`Failed to fetch progress logs for program ${program.id}:`, progressResponse.status, errorText);
                        }
                    } catch (error) {
                        console.error(`Error fetching progress logs for program ${program.id}:`, error);
                    }
                }
                
                console.log('All progress logs collected:', allProgressLogs);
                
                // Sort progress logs by completed_at date (newest first)
                allProgressLogs.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
                setProgressLogs(allProgressLogs);
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Client Profile Header */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="flex items-center space-x-6">
                            <div className="flex-shrink-0">
                                {client?.profile_picture ? (
                                    <img
                                        src={client.profile_picture}
                                        alt={client.name + "'s profile"}
                                        className="h-24 w-24 rounded-full object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-3xl font-medium text-indigo-600">
                                            {client?.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900">{client?.name}</h1>
                                <p className="mt-1 text-lg text-gray-600">{client?.email}</p>
                                {client?.phone_number && (
                                    <p className="mt-1 text-gray-600">{client.phone_number}</p>
                                )}
                            </div>
                        </div>
                        {client?.bio && (
                            <div className="mt-6">
                                <h3 className="text-sm font-medium text-gray-500">About</h3>
                                <p className="mt-2 text-gray-700">{client.bio}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('programs')}
                                className={`${
                                    activeTab === 'programs'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                            >
                                Programs
                            </button>
                            <button
                                onClick={() => setActiveTab('questionnaire')}
                                className={`${
                                    activeTab === 'questionnaire'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                            >
                                Questionnaire
                            </button>
                            <button
                                onClick={() => setActiveTab('progress-logs')}
                                className={`${
                                    activeTab === 'progress-logs'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                            >
                                Progress Logs
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'programs' && (
                            <div>
                                {programs.length > 0 ? (
                                    <div className="space-y-6">
                                        {programs.map((program) => (
                                            <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">Current Program</h3>
                                                        <p className="mt-1 text-xl font-semibold text-indigo-600">{program.title}</p>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        program.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {program.status}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="mt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium text-gray-700">Program Progress</span>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {Math.round((program.completed_weeks / program.total_weeks) * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div 
                                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${(program.completed_weeks / program.total_weeks) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        {program.completed_weeks} of {program.total_weeks} weeks completed
                                                    </p>
                                                </div>

                                                {/* View Comments Button */}
                                                <div className="mt-6">
                                                    <button
                                                        onClick={() => router.push(`/client/${program.client_id}/comments/${program.id}`)}
                                                        className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                                                    >
                                                        View Comments
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Created</h3>
                                        <p className="text-gray-500">This client doesn't have any programs yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'questionnaire' && (
                            <div>
                                {questionnaire ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(questionnaire.answers).map(([key, value]) => (
                                            <div key={key} className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-gray-500">{key}</h3>
                                                <p className="mt-1 text-lg text-gray-900">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questionnaire Responses</h3>
                                        <p className="text-gray-500">This client hasn't completed the questionnaire yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'progress-logs' && (
                            <div>
                                {progressLogs.length > 0 ? (
                                    <div className="space-y-6">
                                        {progressLogs.map((log) => (
                                            <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {log.is_rest_day ? 'Rest Day' : log.exercise?.name || 'Workout'}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            {new Date(log.completed_at).toLocaleDateString()} at {new Date(log.completed_at).toLocaleTimeString()}
                                                        </p>
                                                        {log.week && log.day && (
                                                            <p className="mt-1 text-sm text-gray-500">
                                                                {log.week.name} - {log.day.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        log.is_rest_day ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {log.is_rest_day ? 'Rest Day' : 'Completed'}
                                                    </span>
                                                </div>

                                                {!log.is_rest_day && log.exercise && (
                                                    <div className="mt-4 space-y-3">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {log.weight && (
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <h4 className="text-xs font-medium text-gray-500">Weight</h4>
                                                                    <p className="mt-1 text-lg font-semibold text-gray-900">{log.weight} kg</p>
                                                                </div>
                                                            )}
                                                            {log.reps && (
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <h4 className="text-xs font-medium text-gray-500">Reps</h4>
                                                                    <p className="mt-1 text-lg font-semibold text-gray-900">{log.reps}</p>
                                                                </div>
                                                            )}
                                                            {log.time_seconds && (
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <h4 className="text-xs font-medium text-gray-500">Time</h4>
                                                                    <p className="mt-1 text-lg font-semibold text-gray-900">{log.time_seconds}s</p>
                                                                </div>
                                                            )}
                                                            {log.rpe && (
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <h4 className="text-xs font-medium text-gray-500">RPE</h4>
                                                                    <p className="mt-1 text-lg font-semibold text-gray-900">{log.rpe}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {log.workout_duration && (
                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                <h4 className="text-xs font-medium text-gray-500">Workout Duration</h4>
                                                                <p className="mt-1 text-lg font-semibold text-gray-900">{log.workout_duration} minutes</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {log.is_rest_day && (
                                                    <div className="mt-4 bg-blue-50 rounded-lg p-4">
                                                        <div className="flex items-center">
                                                            <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <p className="text-blue-800 font-medium">Rest day completed</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Comments count */}
                                                {log.comments && log.comments.length > 0 && (
                                                    <div className="mt-4 flex items-center text-sm text-gray-500">
                                                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        {log.comments.length} comment{log.comments.length !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Logs</h3>
                                        <p className="text-gray-500">This client doesn't have any progress logs yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 