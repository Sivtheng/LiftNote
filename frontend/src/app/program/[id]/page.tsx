'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../../components/Navbar';
import ExerciseModal from './ExerciseModal';
import { use } from 'react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';

interface Week {
    id: string;
    name: string;
    days: Day[];
    program_id: string;
    order: number;
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

interface Program {
    id: string;
    title: string;
    description?: string;
    client?: {
        id: string;
        name: string;
    };
    weeks: Week[];
    total_weeks: number;
    completed_weeks: number;
}

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [program, setProgram] = useState<Program>({ id: '', title: '', weeks: [], total_weeks: 0, completed_weeks: 0 });
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Day | null>(null);
    const [editingWeek, setEditingWeek] = useState<string | null>(null);
    const [editingWeekName, setEditingWeekName] = useState<string>('');
    const [editingDay, setEditingDay] = useState<{ weekId: string; dayId: string } | null>(null);
    const [showWeekDropdown, setShowWeekDropdown] = useState<string | null>(null);
    const [showDayDropdown, setShowDayDropdown] = useState<{ weekId: string; dayId: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [editingDayName, setEditingDayName] = useState<string>('');
    const [showTotalWeeksModal, setShowTotalWeeksModal] = useState(false);
    const [newTotalWeeks, setNewTotalWeeks] = useState<number>(0);
    const [isUpdatingTotalWeeks, setIsUpdatingTotalWeeks] = useState(false);

    const fetchProgram = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}`, {
                headers: getAuthHeaders(token)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch program');
            }

            const data = await response.json();

            if (!data.program) {
                throw new Error('Invalid response format: program data missing');
            }

            // Initialize program data with empty weeks array
            const programData = {
                ...data.program,
                title: data.program.title || 'Untitled Program',
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
                        video_link: exercise.video_link,
                        day_id: day.id
                    }))
                })),
                order: week.order
            }));

            setProgram(programData);
            setWeeks(programData.weeks);
        } catch (error) {
            console.error('Error fetching program:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch program');
            setProgram({ id: '', title: '', weeks: [], total_weeks: 0, completed_weeks: 0 });
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
            // Check if the click is on a dropdown button or menu
            const target = event.target as HTMLElement;
            const isDropdownButton = target.closest('button[aria-haspopup="true"]');
            const isDropdownMenu = target.closest('[role="menu"]');
            
            if (!isDropdownButton && !isDropdownMenu) {
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks`, {
                method: 'POST',
                headers: getAuthHeaders(token),
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
                days: data.week.days || [],
                order: data.week.order
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days`, {
                method: 'POST',
                headers: getAuthHeaders(token),
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

            switch (action) {
                case 'duplicate': {
                    const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/duplicate`, {
                        method: 'POST',
                        headers: getAuthHeaders(token)
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
                        console.error('Invalid response format: week data missing', data);
                        throw new Error('Invalid response format: week data missing');
                    }

                    // Process the new week data to ensure unique IDs
                    const newWeek = {
                        ...data.week,
                        days: data.week.days.map((day: any) => ({
                            ...day,
                            exercises: day.exercises.map((exercise: any) => ({
                                ...exercise,
                                id: exercise.id,
                                name: exercise.name,
                                sets: exercise.pivot.sets,
                                reps: exercise.pivot.reps,
                                time_seconds: exercise.pivot.time_seconds,
                                measurement_type: exercise.pivot.measurement_type,
                                measurement_value: exercise.pivot.measurement_value,
                                description: exercise.description,
                                video_link: exercise.video_link,
                                day_id: day.id
                            }))
                        }))
                    };

                    setWeeks(prevWeeks => {
                        const updatedWeeks = [...prevWeeks];
                        updatedWeeks.splice(weekIndex + 1, 0, newWeek);
                        return updatedWeeks;
                    });
                    break;
                }
                case 'delete': {
                    const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(token)
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
                case 'rename': {
                    const week = weeks[weekIndex];
                    setEditingWeekName(week.name);
                    setEditingWeek(weekId);
                    break;
                }
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
            if (!token) {
                setError('Authentication token not found');
                return;
            }

            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) {
                setError('Week not found');
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify({ 
                    name: newName,
                    order: weeks[weekIndex].order 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Failed to rename week:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: data
                });
                throw new Error(data.message || `Failed to rename week: ${response.status} ${response.statusText}`);
            }

            if (!data.week) {
                throw new Error('Invalid response format: week data missing');
            }

            // Update the state with the new week name
            setWeeks(prevWeeks => {
                const updatedWeeks = [...prevWeeks];
                updatedWeeks[weekIndex] = {
                    ...updatedWeeks[weekIndex],
                    name: data.week.name
                };
                return updatedWeeks;
            });
            setEditingWeek(null);
            setEditingWeekName('');
        } catch (error) {
            console.error('Error renaming week:', error);
            setError(error instanceof Error ? error.message : 'Failed to rename week');
        }
    };

    const handleDayAction = async (weekId: string, dayId: string, action: 'delete' | 'rename' | 'duplicate') => {
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

            const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === dayId);
            if (dayIndex === -1) {
                setError('Day not found');
                return;
            }

            switch (action) {
                case 'duplicate': {
                    const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}/duplicate`, {
                        method: 'POST',
                        headers: getAuthHeaders(token)
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        console.error('Failed to duplicate day:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: data
                        });
                        throw new Error(data.message || `Failed to duplicate day: ${response.status} ${response.statusText}`);
                    }

                    if (!data.day) {
                        throw new Error('Invalid response format: day data missing');
                    }

                    // Process the new day data to ensure all exercise data is properly handled
                    const newDay = {
                        ...data.day,
                        exercises: data.day.exercises.map((exercise: any) => ({
                            ...exercise,
                            id: exercise.id,
                            name: exercise.name,
                            sets: exercise.pivot.sets,
                            reps: exercise.pivot.reps,
                            time_seconds: exercise.pivot.time_seconds,
                            measurement_type: exercise.pivot.measurement_type,
                            measurement_value: exercise.pivot.measurement_value,
                            description: exercise.description,
                            video_link: exercise.video_link,
                            day_id: data.day.id
                        }))
                    };

                    // Update the state with the new day
                    setWeeks(prevWeeks => {
                        const updatedWeeks = [...prevWeeks];
                        updatedWeeks[weekIndex] = {
                            ...updatedWeeks[weekIndex],
                            days: [
                                ...updatedWeeks[weekIndex].days.slice(0, dayIndex + 1),
                                newDay,
                                ...updatedWeeks[weekIndex].days.slice(dayIndex + 1)
                            ]
                        };
                        return updatedWeeks;
                    });
                    break;
                }
                case 'delete': {
                    const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(token)
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        console.error('Failed to delete day:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: data
                        });
                        throw new Error(data.message || `Failed to delete day: ${response.status} ${response.statusText}`);
                    }

                    if (data.message !== 'Day deleted successfully') {
                        throw new Error('Unexpected response from server');
                    }

                    // Update the state to remove the deleted day
                    setWeeks(prevWeeks => {
                        const updatedWeeks = [...prevWeeks];
                        updatedWeeks[weekIndex] = {
                            ...updatedWeeks[weekIndex],
                            days: updatedWeeks[weekIndex].days.filter(d => d.id !== dayId)
                        };
                        return updatedWeeks;
                    });
                    break;
                }
                case 'rename': {
                    const day = weeks[weekIndex].days[dayIndex];
                    setEditingDayName(day.name);
                    setEditingDay({ weekId, dayId });
                    break;
                }
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

            const weekIndex = weeks.findIndex(w => w.id === weekId);
            if (weekIndex === -1) return;

            const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === dayId);
            if (dayIndex === -1) return;

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify({ 
                    name: newName,
                    order: dayIndex + 1
                })
            });

            if (!response.ok) {
                throw new Error('Failed to rename day');
            }

            const data = await response.json();
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${selectedDay.week_id}/days/${selectedDay.id}/exercises`, {
                method: 'POST',
                headers: getAuthHeaders(token),
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
                sets: exercise.sets,
                reps: exercise.reps,
                time_seconds: exercise.time_seconds,
                measurement_type: exercise.measurement_type,
                measurement_value: exercise.measurement_value,
                description: exercise.description,
                video_link: exercise.video_link,
                day_id: selectedDay.id
            };

            // Update the state with the new exercise
            setWeeks(prevWeeks => {
                return prevWeeks.map(week => {
                    if (week.id === selectedDay.week_id) {
                        return {
                            ...week,
                            days: week.days.map(day => {
                                if (day.id === selectedDay.id) {
                                    return {
                                        ...day,
                                        exercises: [...day.exercises, newExercise]
                                    };
                                }
                                return day;
                            })
                        };
                    }
                    return week;
                });
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${selectedDay.week_id}/days/${selectedDay.id}/exercises/${exercise.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
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
                return prevWeeks.map(week => {
                    if (week.id === selectedDay.week_id) {
                        return {
                            ...week,
                            days: week.days.map(day => {
                                if (day.id === selectedDay.id) {
                                    return {
                                        ...day,
                                        exercises: day.exercises.map(ex => {
                                            if (ex.id === exercise.id) {
                                                return {
                                                    ...exercise,
                                                    id: data.exercise.id,
                                                    name: data.exercise.name,
                                                    day_id: selectedDay.id
                                                };
                                            }
                                            return ex;
                                        })
                                    };
                                }
                                return day;
                            })
                        };
                    }
                    return week;
                });
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

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}/exercises/${exerciseId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(token)
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
            if (!token) {
                setError('Authentication token not found');
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/weeks/${weekId}/days/${dayId}/exercises`, {
                method: 'POST',
                headers: getAuthHeaders(token),
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

            // Process the new exercise data
            const newExercise = {
                id: data.exercise.id,
                name: data.exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                time_seconds: exercise.time_seconds,
                measurement_type: exercise.measurement_type,
                measurement_value: exercise.measurement_value,
                description: exercise.description,
                video_link: exercise.video_link,
                day_id: dayId
            };

            // Update the state with the new exercise
            setWeeks(prevWeeks => {
                return prevWeeks.map(week => {
                    if (week.id === weekId) {
                        return {
                            ...week,
                            days: week.days.map(day => {
                                if (day.id === dayId) {
                                    return {
                                        ...day,
                                        exercises: [...day.exercises, newExercise]
                                    };
                                }
                                return day;
                            })
                        };
                    }
                    return week;
                });
            });
        } catch (error) {
            console.error('Error duplicating exercise:', error);
            setError(error instanceof Error ? error.message : 'Failed to duplicate exercise');
        }
    };

    const handleUpdateTotalWeeks = async () => {
        try {
            setIsUpdatingTotalWeeks(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token not found');
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/programs/${resolvedParams.id}/builder/total-weeks`, {
                method: 'PUT',
                headers: getAuthHeaders(token),
                body: JSON.stringify({
                    total_weeks: newTotalWeeks
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Failed to update total weeks:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(errorData?.message || `Failed to update total weeks: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.program) {
                throw new Error('Invalid response format: program data missing');
            }

            // Update the program state
            setProgram(prevProgram => ({
                ...prevProgram,
                total_weeks: data.program.total_weeks
            }));

            setShowTotalWeeksModal(false);
            setNewTotalWeeks(0);
        } catch (error) {
            console.error('Error updating total weeks:', error);
            setError(error instanceof Error ? error.message : 'Failed to update total weeks');
        } finally {
            setIsUpdatingTotalWeeks(false);
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
                <div className="flex justify-between items-start mb-12">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-gray-900">{program.title || 'Untitled Program'}</h1>
                        <div className="space-y-2">
                            <p className="text-lg text-gray-600">
                                <span className="font-semibold">Client:</span> {program.client?.name || 'No client assigned'}
                            </p>
                            <p className="text-lg text-gray-600">
                                <span className="font-semibold">Description:</span> {program.description || 'No description provided'}
                            </p>
                            <p className="text-lg text-gray-600">
                                <span className="font-semibold">Weeks:</span> {weeks.length} of {program.total_weeks} weeks
                                {weeks.length >= program.total_weeks && (
                                    <button
                                        onClick={() => {
                                            setNewTotalWeeks(program.total_weeks + 1);
                                            setShowTotalWeeksModal(true);
                                        }}
                                        className="ml-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        Increase Limit
                                    </button>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/program')}
                        className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Finish
                    </button>
                </div>

                {/* Weeks Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {Array.isArray(weeks) && weeks.map((week) => (
                        <div key={week.id} className={`bg-white rounded-xl shadow-lg p-6 ${
                            week.order <= program.completed_weeks ? 'border-l-4 border-l-green-500' : ''
                        }`}>
                            <div className="flex justify-between items-center mb-4">
                                {editingWeek === week.id ? (
                                    <input
                                        type="text"
                                        value={editingWeekName}
                                        onChange={(e) => setEditingWeekName(e.target.value)}
                                        onBlur={() => {
                                            if (editingWeekName.trim()) {
                                                handleWeekRename(week.id, editingWeekName);
                                            } else {
                                                setEditingWeek(null);
                                                setEditingWeekName('');
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editingWeekName.trim()) {
                                                handleWeekRename(week.id, editingWeekName);
                                            } else if (e.key === 'Escape') {
                                                setEditingWeek(null);
                                                setEditingWeekName('');
                                            }
                                        }}
                                        className="text-xl font-semibold text-gray-900 px-2 py-1 border rounded"
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold text-gray-900">{week.name}</h3>
                                        {week.order <= program.completed_weeks && (
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowWeekDropdown(showWeekDropdown === week.id ? null : week.id);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                        aria-haspopup="true"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                    {showWeekDropdown === week.id && (
                                        <div 
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            role="menu"
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleWeekAction(week.id, 'rename');
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Rename
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleWeekAction(week.id, 'duplicate');
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Duplicate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleWeekAction(week.id, 'delete');
                                                }}
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
                                    <div key={day.id} className="bg-gray-50 rounded-lg p-4 w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            {editingDay?.weekId === week.id && editingDay?.dayId === day.id ? (
                                                <input
                                                    type="text"
                                                    value={editingDayName}
                                                    onChange={(e) => setEditingDayName(e.target.value)}
                                                    onBlur={() => {
                                                        if (editingDayName.trim()) {
                                                            handleDayRename(week.id, day.id, editingDayName);
                                                        } else {
                                                            setEditingDay(null);
                                                            setEditingDayName('');
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && editingDayName.trim()) {
                                                            handleDayRename(week.id, day.id, editingDayName);
                                                        } else if (e.key === 'Escape') {
                                                            setEditingDay(null);
                                                            setEditingDayName('');
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newState = showDayDropdown?.weekId === week.id && showDayDropdown?.dayId === day.id
                                                            ? null
                                                            : { weekId: week.id, dayId: day.id };
                                                        setShowDayDropdown(newState);
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded-lg"
                                                    aria-haspopup="true"
                                                >
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>
                                                {showDayDropdown?.weekId === week.id && showDayDropdown?.dayId === day.id && (
                                                    <div 
                                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                        role="menu"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDayAction(week.id, day.id, 'rename');
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            role="menuitem"
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDayAction(week.id, day.id, 'duplicate');
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            role="menuitem"
                                                        >
                                                            Duplicate
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDayAction(week.id, day.id, 'delete');
                                                            }}
                                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                            role="menuitem"
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
                                            <div className="space-y-4 w-full">
                                                <div className="w-full">
                                                    <table className="w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                                                                    Exercise
                                                                </th>
                                                                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                                    Sets
                                                                </th>
                                                                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                                    Rep/Time
                                                                </th>
                                                                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                                    RPE/KG
                                                                </th>
                                                                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                                    Video
                                                                </th>
                                                                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {day.exercises.map((exercise) => (
                                                                <tr key={exercise.id}>
                                                                    <td className="px-2 py-2">
                                                                        <div className="text-sm font-medium text-gray-900 break-words whitespace-normal">{exercise.name}</div>
                                                                        {exercise.description && (
                                                                            <div className="text-sm text-gray-500 break-words whitespace-normal">{exercise.description}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <div className="text-sm text-gray-900">{exercise.sets}</div>
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <div className="text-sm text-gray-900">
                                                                            {exercise.reps ? `${exercise.reps} reps` : `${exercise.time_seconds}s`}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        <div className="text-sm text-gray-900">
                                                                            {exercise.measurement_type === 'kg' 
                                                                                ? `${exercise.measurement_value} kg`
                                                                                : `RPE ${exercise.measurement_value}`
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                        {exercise.video_link && (
                                                                            <a 
                                                                                href={exercise.video_link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-indigo-600 hover:text-indigo-900 text-sm truncate block max-w-[100px]"
                                                                            >
                                                                                View Video
                                                                            </a>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-2 py-2 text-right text-sm font-medium">
                                                                        <div className="flex space-x-1">
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
                        disabled={weeks.length >= program.total_weeks}
                        className={`bg-white rounded-xl shadow-lg p-6 border-2 border-dashed transition-colors duration-200 ${
                            weeks.length >= program.total_weeks
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-indigo-500 hover:bg-gray-50'
                        }`}
                    >
                        <div className="text-center">
                            <svg className={`mx-auto h-12 w-12 ${weeks.length >= program.total_weeks ? 'text-gray-300' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className={`mt-2 text-lg font-medium ${weeks.length >= program.total_weeks ? 'text-gray-400' : 'text-gray-900'}`}>
                                {weeks.length >= program.total_weeks 
                                    ? `Maximum weeks reached (${program.total_weeks})`
                                    : 'Add Week'
                                }
                            </p>
                            {weeks.length >= program.total_weeks && (
                                <p className="mt-1 text-sm text-gray-500">
                                    Increase the week limit to add more weeks
                                </p>
                            )}
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

            {/* Total Weeks Modal */}
            {showTotalWeeksModal && (
                <div className="fixed inset-0 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Increase Week Limit</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Current limit: {program.total_weeks} weeks. Current weeks: {weeks.length}
                            </p>
                            <div className="mb-4">
                                <label htmlFor="newTotalWeeks" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Total Weeks
                                </label>
                                <input
                                    type="number"
                                    id="newTotalWeeks"
                                    min={weeks.length}
                                    max={52}
                                    value={newTotalWeeks}
                                    onChange={(e) => setNewTotalWeeks(parseInt(e.target.value) || 0)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowTotalWeeksModal(false);
                                        setNewTotalWeeks(0);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-transparent rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateTotalWeeks}
                                    disabled={isUpdatingTotalWeeks || newTotalWeeks <= program.total_weeks}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdatingTotalWeeks ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 