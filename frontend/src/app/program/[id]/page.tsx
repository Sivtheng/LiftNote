'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../../components/Navbar';
import ExerciseModal from './ExerciseModal';
import { use } from 'react';

interface Week {
    id: string;
    name: string;
    days: Day[];
    program_id: string;
}

interface Day {
    id: string;
    name: string;
    exercises: Exercise[];
    week_id: string;
}

interface Exercise {
    id: string;
    name: string;
    sets: number;
    reps?: number;
    time_seconds?: number;
    measurement_type: 'rpe' | 'kg';
    measurement_value: number;
    description?: string;
    video_link?: string;
    day_id: string;
}

const API_URL = 'http://localhost:8000/api';
const SANCTUM_COOKIE_URL = 'http://localhost:8000';

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [program, setProgram] = useState<any>({ weeks: [] });
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Day | null>(null);
    const [editingWeek, setEditingWeek] = useState<string | null>(null);
    const [editingDay, setEditingDay] = useState<{ weekId: string; dayId: string } | null>(null);
    const [showWeekDropdown, setShowWeekDropdown] = useState<string | null>(null);
    const [showDayDropdown, setShowDayDropdown] = useState<{ weekId: string; dayId: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

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

    const fetchProgram = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}`, {
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
                throw new Error('Failed to fetch program');
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (!data.program) {
                throw new Error('Invalid response format: program data missing');
            }

            // Initialize program data with empty weeks array
            const programData = {
                ...data.program,
                weeks: data.program.weeks || []
            };

            // Process weeks and their relationships
            programData.weeks = programData.weeks.map((week: any) => ({
                id: week.id,
                name: week.name,
                program_id: week.program_id,
                days: (week.days || []).map((day: any) => ({
                    id: day.id,
                    name: day.name,
                    week_id: day.week_id,
                    exercises: (day.exercises || []).map((exercise: any) => ({
                        id: exercise.id,
                        name: exercise.name,
                        sets: exercise.pivot?.sets,
                        reps: exercise.pivot?.reps,
                        time_seconds: exercise.pivot?.time_seconds,
                        measurement_type: exercise.pivot?.measurement_type,
                        measurement_value: exercise.pivot?.measurement_value,
                        description: exercise.description,
                        videoLink: exercise.video_link,
                        day_id: day.id
                    }))
                }))
            }));

            console.log('Processed Program Data:', programData);
            setProgram(programData);
            setWeeks(programData.weeks);
        } catch (error) {
            console.error('Error fetching program:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch program');
            setProgram({ weeks: [] });
            setWeeks([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchProgram();
        }
    }, [isAuthenticated, resolvedParams.id]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowWeekDropdown(null);
                setShowDayDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddWeek = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    name: `Week ${weeks.length + 1}`,
                    order: weeks.length + 1
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Failed to add week:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData?.message || `Failed to add week: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.week) {
                throw new Error('Invalid response format: week data missing');
            }

            // Process the new week data
            const newWeek = {
                id: data.week.id,
                name: data.week.name,
                program_id: data.week.program_id,
                days: data.week.days || []
            };

            setWeeks(prevWeeks => [...prevWeeks, newWeek]);
        } catch (error) {
            console.error('Error adding week:', error);
            setError(error instanceof Error ? error.message : 'Failed to add week');
        }
    };

    const handleAddDay = async (weekId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found');
                return;
            }

            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) {
                setError('Week not found');
                return;
            }

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    name: `Day ${weeks[weekIndex].days.length + 1}`,
                    order: weeks[weekIndex].days.length + 1
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Failed to add day:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data
                });
                throw new Error(data.message || `Failed to add day: ${response.status} ${response.statusText}`);
            }

            if (!data.day) {
                throw new Error('Invalid response format: day data missing');
            }

            // Process the new day data
            const newDay = {
                id: data.day.id,
                name: data.day.name,
                week_id: data.day.week_id,
                exercises: data.day.exercises || []
            };

            setWeeks(prevWeeks => {
                const updatedWeeks = [...prevWeeks];
                updatedWeeks[weekIndex] = {
                    ...updatedWeeks[weekIndex],
                    days: [...updatedWeeks[weekIndex].days, newDay]
                };
                return updatedWeeks;
            });
        } catch (error) {
            console.error('Error adding day:', error);
            setError(error instanceof Error ? error.message : 'Failed to add day');
        }
    };

    const handleWeekAction = async (weekId: string, action: 'duplicate' | 'delete' | 'rename') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found');
                return;
            }

            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) {
                setError('Week not found');
                return;
            }

            const xsrfToken = await getCsrfToken();
            switch (action) {
                case 'duplicate': {
                    const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/duplicate`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': xsrfToken
                        },
                        credentials: 'include',
                        mode: 'cors'
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        console.error('Failed to duplicate week:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: data
                        });
                        throw new Error(data.message || `Failed to duplicate week: ${response.status} ${response.statusText}`);
                    }

                    if (!data.week) {
                        throw new Error('Invalid response format: week data missing');
                    }

                    setWeeks(prevWeeks => {
                        const updatedWeeks = [...prevWeeks];
                        updatedWeeks.splice(weekIndex + 1, 0, data.week);
                        return updatedWeeks;
                    });
                    break;
                }
                case 'delete': {
                    const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': xsrfToken
                        },
                        credentials: 'include',
                        mode: 'cors'
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        console.error('Failed to delete week:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: data
                        });
                        throw new Error(data.message || `Failed to delete week: ${response.status} ${response.statusText}`);
                    }

                    if (data.message !== 'Week deleted successfully') {
                        throw new Error('Unexpected response from server');
                    }

                    setWeeks(prevWeeks => {
                        const updatedWeeks = [...prevWeeks];
                        updatedWeeks.splice(weekIndex, 1);
                        return updatedWeeks;
                    });
                    break;
                }
                case 'rename':
                    setEditingWeek(weekId);
                    break;
            }
            setShowWeekDropdown(null);
        } catch (error) {
            console.error('Error performing week action:', error);
            setError(error instanceof Error ? error.message : 'Failed to perform week action');
        }
    };

    const handleWeekRename = async (weekId: string, newName: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) {
                throw new Error('Failed to rename week');
            }

            const data = await response.json();
            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) return;

            const updatedWeeks = [...weeks];
            updatedWeeks[weekIndex].name = data.week.name;
            setWeeks(updatedWeeks);
            setEditingWeek(null);
        } catch (error) {
            console.error('Error renaming week:', error);
            setError(error instanceof Error ? error.message : 'Failed to rename week');
        }
    };

    const handleDayAction = async (weekId: string, dayId: string, action: 'delete' | 'rename') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) return;

            const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === dayId);
            if (dayIndex === -1) return;

            const xsrfToken = await getCsrfToken();
            switch (action) {
                case 'delete': {
                    const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}`, {
                        method: 'DELETE',
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
                        const errorData = await response.json().catch(() => null);
                        console.error('Failed to delete day:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: errorData
                        });
                        throw new Error(errorData?.message || `Failed to delete day: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    if (data.message !== 'Day deleted successfully') {
                        throw new Error('Unexpected response from server');
                    }

                    setWeeks(prevWeeks => {
                        const updatedWeeks = [...prevWeeks];
                        updatedWeeks[weekIndex].days.splice(dayIndex, 1);
                        return updatedWeeks;
                    });
                    break;
                }
                case 'rename':
                    setEditingDay({ weekId, dayId });
                    break;
            }
            setShowDayDropdown(null);
        } catch (error) {
            console.error('Error performing day action:', error);
            setError(error instanceof Error ? error.message : 'Failed to perform day action');
        }
    };

    const handleDayRename = async (weekId: string, dayId: string, newName: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/days/${dayId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ name: newName })
            });

            if (!response.ok) {
                throw new Error('Failed to rename day');
            }

            const data = await response.json();
            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) return;

            const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === dayId);
            if (dayIndex === -1) return;

            const updatedWeeks = [...weeks];
            updatedWeeks[weekIndex].days[dayIndex].name = data.day.name;
            setWeeks(updatedWeeks);
            setEditingDay(null);
        } catch (error) {
            console.error('Error renaming day:', error);
            setError(error instanceof Error ? error.message : 'Failed to rename day');
        }
    };

    const handleAddExercise = async (exercise: Exercise) => {
        if (!selectedDay) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${selectedDay.week_id}/days/${selectedDay.id}/exercises`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    name: exercise.name,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    time_seconds: exercise.time_seconds,
                    measurement_type: exercise.measurement_type,
                    measurement_value: exercise.measurement_value,
                    description: exercise.description,
                    video_link: exercise.video_link
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Failed to add exercise:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData?.message || `Failed to add exercise: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.exercise) {
                throw new Error('Invalid response format: exercise data missing');
            }

            // Process the new exercise data
            const newExercise = {
                id: data.exercise.id,
                name: data.exercise.name,
                sets: data.exercise.pivot?.sets,
                reps: data.exercise.pivot?.reps,
                time_seconds: data.exercise.pivot?.time_seconds,
                measurement_type: data.exercise.pivot?.measurement_type,
                measurement_value: data.exercise.pivot?.measurement_value,
                description: data.exercise.description,
                video_link: data.exercise.video_link,
                day_id: selectedDay.id
            };

            setWeeks(prevWeeks => {
                const updatedWeeks = [...prevWeeks];
                const weekIndex = updatedWeeks.findIndex(w => w.days.some(d => d.id === selectedDay.id));
                if (weekIndex === -1) return prevWeeks;

                const dayIndex = updatedWeeks[weekIndex].days.findIndex(d => d.id === selectedDay.id);
                if (dayIndex === -1) return prevWeeks;

                updatedWeeks[weekIndex].days[dayIndex] = {
                    ...updatedWeeks[weekIndex].days[dayIndex],
                    exercises: [...updatedWeeks[weekIndex].days[dayIndex].exercises, newExercise]
                };

                return updatedWeeks;
            });

            setShowExerciseModal(false);
            setSelectedDay(null);
        } catch (error) {
            console.error('Error adding exercise:', error);
            setError(error instanceof Error ? error.message : 'Failed to add exercise');
        }
    };

    const handleEditExercise = async (exercise: Exercise) => {
        if (!selectedDay) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${selectedDay.week_id}/days/${selectedDay.id}/exercises/${exercise.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    name: exercise.name,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    time_seconds: exercise.time_seconds,
                    measurement_type: exercise.measurement_type,
                    measurement_value: exercise.measurement_value,
                    description: exercise.description,
                    video_link: exercise.video_link
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Failed to edit exercise:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData?.message || `Failed to edit exercise: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.exercise) {
                throw new Error('Invalid response format: exercise data missing');
            }

            // Update the exercise in the state
            setWeeks(prevWeeks => {
                const updatedWeeks = [...prevWeeks];
                const weekIndex = updatedWeeks.findIndex(w => w.days.some(d => d.id === selectedDay.id));
                if (weekIndex === -1) return prevWeeks;

                const dayIndex = updatedWeeks[weekIndex].days.findIndex(d => d.id === selectedDay.id);
                if (dayIndex === -1) return prevWeeks;

                const exerciseIndex = updatedWeeks[weekIndex].days[dayIndex].exercises.findIndex(e => e.id === exercise.id);
                if (exerciseIndex === -1) return prevWeeks;

                updatedWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex] = {
                    ...data.exercise,
                    sets: data.exercise.pivot?.sets,
                    reps: data.exercise.pivot?.reps,
                    time_seconds: data.exercise.pivot?.time_seconds,
                    measurement_type: data.exercise.pivot?.measurement_type,
                    measurement_value: data.exercise.pivot?.measurement_value,
                    day_id: selectedDay.id
                };

                return updatedWeeks;
            });

            setShowExerciseModal(false);
            setSelectedDay(null);
            setEditingExercise(null);
        } catch (error) {
            console.error('Error editing exercise:', error);
            setError(error instanceof Error ? error.message : 'Failed to edit exercise');
        }
    };

    const handleDeleteExercise = async (weekId: string, dayId: string, exerciseId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}/exercises/${exerciseId}`, {
                method: 'DELETE',
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
                const errorData = await response.json().catch(() => null);
                console.error('Failed to delete exercise:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData?.message || `Failed to delete exercise: ${response.status} ${response.statusText}`);
            }

            // Remove the exercise from the state
            setWeeks(prevWeeks => {
                const updatedWeeks = [...prevWeeks];
                const weekIndex = updatedWeeks.findIndex(w => w.id === weekId);
                if (weekIndex === -1) return prevWeeks;

                const dayIndex = updatedWeeks[weekIndex].days.findIndex(d => d.id === dayId);
                if (dayIndex === -1) return prevWeeks;

                updatedWeeks[weekIndex].days[dayIndex].exercises = updatedWeeks[weekIndex].days[dayIndex].exercises.filter(e => e.id !== exerciseId);
                return updatedWeeks;
            });
        } catch (error) {
            console.error('Error deleting exercise:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete exercise');
        }
    };

    const handleDuplicateExercise = async (weekId: string, dayId: string, exercise: Exercise) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const xsrfToken = await getCsrfToken();
            const response = await fetch(`${API_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}/exercises`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({
                    name: `${exercise.name} (Copy)`,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    time_seconds: exercise.time_seconds,
                    measurement_type: exercise.measurement_type,
                    measurement_value: exercise.measurement_value,
                    description: exercise.description,
                    video_link: exercise.video_link
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Failed to duplicate exercise:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData?.message || `Failed to duplicate exercise: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.exercise) {
                throw new Error('Invalid response format: exercise data missing');
            }

            // Add the duplicated exercise to the state
            setWeeks(prevWeeks => {
                const updatedWeeks = [...prevWeeks];
                const weekIndex = updatedWeeks.findIndex(w => w.id === weekId);
                if (weekIndex === -1) return prevWeeks;

                const dayIndex = updatedWeeks[weekIndex].days.findIndex(d => d.id === dayId);
                if (dayIndex === -1) return prevWeeks;

                updatedWeeks[weekIndex].days[dayIndex].exercises.push({
                    ...data.exercise,
                    sets: data.exercise.pivot?.sets,
                    reps: data.exercise.pivot?.reps,
                    time_seconds: data.exercise.pivot?.time_seconds,
                    measurement_type: data.exercise.pivot?.measurement_type,
                    measurement_value: data.exercise.pivot?.measurement_value,
                    day_id: dayId
                });

                return updatedWeeks;
            });
        } catch (error) {
            console.error('Error duplicating exercise:', error);
            setError(error instanceof Error ? error.message : 'Failed to duplicate exercise');
        }
    };

    // Add a safety check before rendering
    useEffect(() => {
        if (!Array.isArray(weeks)) {
            console.error('Weeks is not an array:', weeks);
            setWeeks([]);
        }
    }, [weeks]);

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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Program Builder</h1>
                        <p className="mt-3 text-lg text-gray-600">Program Information</p>
                    </div>
                    <button
                        onClick={() => router.push('/program')}
                        className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Finish
                    </button>
                </div>

                {/* Weeks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(weeks) && weeks.map((week) => (
                        <div key={week.id} className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                {editingWeek === week.id ? (
                                    <input
                                        type="text"
                                        value={week.name}
                                        onChange={(e) => handleWeekRename(week.id, e.target.value)}
                                        onBlur={() => setEditingWeek(null)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setEditingWeek(null);
                                            }
                                        }}
                                        className="text-xl font-semibold text-gray-900 px-2 py-1 border rounded"
                                        autoFocus
                                    />
                                ) : (
                                    <h3 className="text-xl font-semibold text-gray-900">{week.name}</h3>
                                )}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setShowWeekDropdown(showWeekDropdown === week.id ? null : week.id)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                    {showWeekDropdown === week.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                                            <button
                                                onClick={() => handleWeekAction(week.id, 'rename')}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => handleWeekAction(week.id, 'duplicate')}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Duplicate
                                            </button>
                                            <button
                                                onClick={() => handleWeekAction(week.id, 'delete')}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Days */}
                            <div className="space-y-4">
                                {week.days.map((day) => (
                                    <div key={day.id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            {editingDay?.weekId === week.id && editingDay?.dayId === day.id ? (
                                                <input
                                                    type="text"
                                                    value={day.name}
                                                    onChange={(e) => handleDayRename(week.id, day.id, e.target.value)}
                                                    onBlur={() => setEditingDay(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setEditingDay(null);
                                                        }
                                                    }}
                                                    className="text-lg font-medium text-gray-900 px-2 py-1 border rounded"
                                                    autoFocus
                                                />
                                            ) : (
                                                <h4 className="text-lg font-medium text-gray-900">{day.name}</h4>
                                            )}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowDayDropdown(
                                                        showDayDropdown?.weekId === week.id && showDayDropdown?.dayId === day.id
                                                            ? null
                                                            : { weekId: week.id, dayId: day.id }
                                                    )}
                                                    className="p-2 hover:bg-gray-200 rounded-lg"
                                                >
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>
                                                {showDayDropdown?.weekId === week.id && showDayDropdown?.dayId === day.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                                                        <button
                                                            onClick={() => handleDayAction(week.id, day.id, 'rename')}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={() => handleDayAction(week.id, day.id, 'delete')}
                                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Exercise List */}
                                        {day.exercises.length === 0 ? (
                                            <div className="text-center py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDay(day);
                                                        setShowExerciseModal(true);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    + Add Exercise
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Exercise
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Sets
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Rep/Time
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    RPE/KG
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {day.exercises.map((exercise) => (
                                                                <tr key={exercise.id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm font-medium text-gray-900">{exercise.name}</div>
                                                                        {exercise.description && (
                                                                            <div className="text-sm text-gray-500">{exercise.description}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">{exercise.sets}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">
                                                                            {exercise.reps ? `${exercise.reps} reps` : `${exercise.time_seconds}s`}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900">
                                                                            {exercise.measurement_type === 'kg' 
                                                                                ? `${exercise.measurement_value} kg`
                                                                                : `RPE ${exercise.measurement_value}`
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        <div className="flex space-x-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setSelectedDay(day);
                                                                                    setShowExerciseModal(true);
                                                                                    setEditingExercise(exercise);
                                                                                }}
                                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteExercise(week.id, day.id, exercise.id)}
                                                                                className="text-red-600 hover:text-red-900"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDuplicateExercise(week.id, day.id, exercise)}
                                                                                className="text-gray-600 hover:text-gray-900"
                                                                            >
                                                                                Duplicate
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedDay(day);
                                                        setShowExerciseModal(true);
                                                    }}
                                                    className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    + Add Exercise
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {week.days.length < 7 && (
                                    <button
                                        onClick={() => handleAddDay(week.id)}
                                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                                    >
                                        + Add Day
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add Week Card */}
                    <button
                        onClick={handleAddWeek}
                        className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="mt-2 text-lg font-medium text-gray-900">Add Week</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Exercise Modal */}
            <ExerciseModal
                isOpen={showExerciseModal}
                onClose={() => {
                    setShowExerciseModal(false);
                    setSelectedDay(null);
                    setEditingExercise(null);
                }}
                onAddExercise={handleAddExercise}
                onEditExercise={handleEditExercise}
                dayId={selectedDay?.id || ''}
                editingExercise={editingExercise}
            />
        </div>
    );
} 