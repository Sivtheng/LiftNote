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
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'programs' | 'questionnaire' | 'progress-logs'>('programs');
    const [selectedSets, setSelectedSets] = useState<ProgressLog[]>([]);
    const [isSetsModalOpen, setIsSetsModalOpen] = useState(false);
    const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');

    const { id } = use(params);

    // Function to fetch progress logs for a specific program
    const fetchProgressLogs = async (programId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const progressResponse = await fetch(`${API_CONFIG.BASE_URL}/programs/${programId}/progress/coach`, {
                headers: getAuthHeaders(token)
            });
                       
            if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                setProgressLogs(progressData.logs || []);
            } else {
                const errorText = await progressResponse.text();
                console.error(`Failed to fetch progress logs for program ${programId}:`, progressResponse.status, errorText);
                setProgressLogs([]);
            }
        } catch (error) {
            console.error(`Error fetching progress logs for program ${programId}:`, error);
            setProgressLogs([]);
        }
    };

    // Function to open sets modal
    const openSetsModal = (sets: ProgressLog[], exerciseName: string) => {
        setSelectedSets(sets);
        setSelectedExerciseName(exerciseName);
        setIsSetsModalOpen(true);
    };

    // Function to close sets modal
    const closeSetsModal = () => {
        setIsSetsModalOpen(false);
        setSelectedSets([]);
        setSelectedExerciseName('');
    };

    // Helper to format duration
    const formatDuration = (duration: number | undefined) => {
        if (!duration || duration <= 0) return '-';
        if (duration < 90) return `${duration} s`;
        return `${(duration / 60).toFixed(1)} min`;
    };

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

                // Set the first program as selected by default
                if (clientPrograms.length > 0) {
                    setSelectedProgramId(clientPrograms[0].id);
                    // Fetch progress logs for the first program
                    await fetchProgressLogs(clientPrograms[0].id);
                }
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

    // Effect to fetch progress logs when selected program changes
    useEffect(() => {
        if (selectedProgramId && activeTab === 'progress-logs') {
            fetchProgressLogs(selectedProgramId);
        }
    }, [selectedProgramId, activeTab]);

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
                                {/* Program Selector */}
                                {programs.length > 0 && (
                                    <div className="mb-6">
                                        <label htmlFor="program-select" className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Program
                                        </label>
                                        <select
                                            id="program-select"
                                            value={selectedProgramId || ''}
                                            onChange={(e) => setSelectedProgramId(Number(e.target.value))}
                                            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            {programs.map((program) => (
                                                <option key={program.id} value={program.id}>
                                                    {program.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {progressLogs.length > 0 ? (
                                    <div className="space-y-8">
                                        {/* Group logs by week */}
                                        {(() => {
                                            const logsByWeek = progressLogs.reduce((acc, log) => {
                                                const weekName = log.week?.name || 'Unknown Week';
                                                if (!acc[weekName]) {
                                                    acc[weekName] = [];
                                                }
                                                acc[weekName].push(log);
                                                return acc;
                                            }, {} as Record<string, ProgressLog[]>);

                                            // Sort weeks by their order
                                            const sortedWeeks = Object.keys(logsByWeek).sort((a, b) => {
                                                const aOrder = parseInt(a.match(/\d+/)?.[0] || '0');
                                                const bOrder = parseInt(b.match(/\d+/)?.[0] || '0');
                                                return aOrder - bOrder;
                                            });

                                            return sortedWeeks.map((weekName) => {
                                                // Group logs by day within each week
                                                const logsByDay = logsByWeek[weekName].reduce((acc, log) => {
                                                    const dayName = log.day?.name || 'Unknown Day';
                                                    const dayKey = `${dayName}_${log.completed_at.split('T')[0]}`; // Include date to handle multiple days with same name
                                                    
                                                    if (!acc[dayKey]) {
                                                        acc[dayKey] = {
                                                            dayName,
                                                            date: log.completed_at.split('T')[0],
                                                            exercises: {} as Record<string, ProgressLog[]>,
                                                            restDays: [] as ProgressLog[]
                                                        };
                                                    }
                                                    
                                                    if (log.is_rest_day) {
                                                        acc[dayKey].restDays.push(log);
                                                    } else {
                                                        const exerciseKey = log.exercise?.name || 'Unknown Exercise';
                                                        if (!acc[dayKey].exercises[exerciseKey]) {
                                                            acc[dayKey].exercises[exerciseKey] = [];
                                                        }
                                                        acc[dayKey].exercises[exerciseKey].push(log);
                                                    }
                                                    
                                                    return acc;
                                                }, {} as Record<string, any>);

                                                // Sort days by their order
                                                const sortedDays = Object.keys(logsByDay).sort((a, b) => {
                                                    const aOrder = parseInt(a.match(/\d+/)?.[0] || '0');
                                                    const bOrder = parseInt(b.match(/\d+/)?.[0] || '0');
                                                    return aOrder - bOrder;
                                                });

                                                return (
                                                    <div key={weekName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                                            <h3 className="text-lg font-semibold text-gray-900">{weekName}</h3>
                                                            <p className="text-sm text-gray-600">
                                                                {Object.keys(logsByDay).length} day{Object.keys(logsByDay).length !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="divide-y divide-gray-200">
                                                            {sortedDays.map((dayKey) => {
                                                                const dayData = logsByDay[dayKey];
                                                                const totalExercises = Object.keys(dayData.exercises).length + dayData.restDays.length;
                                                                
                                                                return (
                                                                    <div key={dayKey} className="p-6">
                                                                        <div className="mb-4">
                                                                            <h4 className="text-md font-semibold text-gray-900">{dayData.dayName}</h4>
                                                                            <p className="text-sm text-gray-600">
                                                                                {new Date(dayData.date).toLocaleDateString()} • {totalExercises} item{totalExercises !== 1 ? 's' : ''}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-4">
                                                                            {/* Rest Days */}
                                                                            {dayData.restDays.map((log: ProgressLog) => (
                                                                                <div key={log.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center">
                                                                                            <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                            </svg>
                                                                                            <span className="font-medium text-blue-900">Rest Day</span>
                                                                                        </div>
                                                                                        <span className="text-sm text-blue-600">
                                                                                            {new Date(log.completed_at).toLocaleTimeString()}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                            
                                                                            {/* Exercises */}
                                                                            {Object.entries(dayData.exercises).map(([exerciseName, logs]) => {
                                                                                const exerciseLogs = logs as ProgressLog[];
                                                                                const setCount = exerciseLogs.length;
                                                                                const avgWeight = exerciseLogs.reduce((sum, log) => sum + (log.weight || 0), 0) / setCount;
                                                                                const avgReps = exerciseLogs.reduce((sum, log) => sum + (log.reps || 0), 0) / setCount;
                                                                                const avgTime = exerciseLogs.reduce((sum, log) => sum + (log.time_seconds || 0), 0) / setCount;
                                                                                const avgRPE = exerciseLogs.reduce((sum, log) => sum + (log.rpe || 0), 0) / setCount;
                                                                                const totalDuration = exerciseLogs.reduce((sum, log) => sum + (log.workout_duration || 0), 0);
                                                                                
                                                                                return (
                                                                                    <div key={exerciseName} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                                                        <div className="flex items-center justify-between mb-3">
                                                                                            <h5 className="font-semibold text-gray-900">{exerciseName}</h5>
                                                                                            <div className="flex items-center space-x-3">
                                                                                                <span className="text-sm text-gray-600">{setCount} set{setCount !== 1 ? 's' : ''}</span>
                                                                                                <button
                                                                                                    onClick={() => openSetsModal(exerciseLogs, exerciseName)}
                                                                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                                                                                                >
                                                                                                    View Sets
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                                            {avgWeight > 0 && (
                                                                                                <div>
                                                                                                    <span className="text-gray-500">Avg Weight:</span>
                                                                                                    <div className="font-medium">{avgWeight.toFixed(1)} kg</div>
                                                                                                </div>
                                                                                            )}
                                                                                            {avgReps > 0 && (
                                                                                                <div>
                                                                                                    <span className="text-gray-500">Avg Reps:</span>
                                                                                                    <div className="font-medium">{avgReps.toFixed(0)}</div>
                                                                                                </div>
                                                                                            )}
                                                                                            {avgTime > 0 && (
                                                                                                <div>
                                                                                                    <span className="text-gray-500">Avg Time:</span>
                                                                                                    <div className="font-medium">{avgTime.toFixed(0)}s</div>
                                                                                                </div>
                                                                                            )}
                                                                                            {avgRPE > 0 && (
                                                                                                <div>
                                                                                                    <span className="text-gray-500">Avg RPE:</span>
                                                                                                    <div className="font-medium">{avgRPE.toFixed(1)}</div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        
                                                                                        {totalDuration > 0 && (
                                                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                                                <span className="text-sm text-gray-500">Total Duration: </span>
                                                                                                <span className="text-sm font-medium">{formatDuration(totalDuration)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        
                                                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                                                            <span className="text-sm text-gray-500">Completed: </span>
                                                                                            <span className="text-sm font-medium">
                                                                                                {new Date(exerciseLogs[0].completed_at).toLocaleTimeString()}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Logs</h3>
                                        <p className="text-gray-500">
                                            {selectedProgramId 
                                                ? "This program doesn't have any progress logs yet." 
                                                : "Select a program to view progress logs."
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sets Modal */}
            {isSetsModalOpen && (
                <div className="fixed inset-0 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedExerciseName} - Individual Sets
                                </h3>
                                <button
                                    onClick={closeSetsModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Set #
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Weight
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reps
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Time (s)
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                RPE
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Duration
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedSets
                                            .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
                                            .map((set, index) => (
                                            <tr key={set.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(set.completed_at).toLocaleTimeString()}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {set.weight ? `${set.weight} kg` : '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {set.reps || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {set.time_seconds || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {set.rpe || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDuration(set.workout_duration)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={closeSetsModal}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 