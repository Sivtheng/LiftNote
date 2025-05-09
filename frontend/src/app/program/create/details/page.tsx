'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import ExerciseModal from './ExerciseModal';

interface Week {
    id: string;
    name: string;
    days: Day[];
}

interface Day {
    id: string;
    name: string;
    exercises: Exercise[];
}

interface Exercise {
    id: string;
    name: string;
    targetTypes: string[];
    values: { [key: string]: number };
    description?: string;
    videoLink?: string;
}

export default function ProgramDetailsPage() {
    const router = useRouter();
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Day | null>(null);
    const [editingWeek, setEditingWeek] = useState<string | null>(null);
    const [editingDay, setEditingDay] = useState<{ weekId: string; dayId: string } | null>(null);
    const [showWeekDropdown, setShowWeekDropdown] = useState<string | null>(null);
    const [showDayDropdown, setShowDayDropdown] = useState<{ weekId: string; dayId: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleAddWeek = () => {
        const newWeek: Week = {
            id: Date.now().toString(),
            name: `Week ${weeks.length + 1}`,
            days: []
        };
        setWeeks([...weeks, newWeek]);
    };

    const handleAddDay = (weekId: string) => {
        const weekIndex = weeks.findIndex(w => w.id === weekId);
        if (weekIndex === -1) return;

        const newDay: Day = {
            id: Date.now().toString(),
            name: `Day ${weeks[weekIndex].days.length + 1}`,
            exercises: []
        };

        const updatedWeeks = [...weeks];
        updatedWeeks[weekIndex].days.push(newDay);
        setWeeks(updatedWeeks);
    };

    const handleWeekAction = (weekId: string, action: 'duplicate' | 'delete' | 'rename') => {
        const weekIndex = weeks.findIndex(w => w.id === weekId);
        if (weekIndex === -1) return;

        const updatedWeeks = [...weeks];
        switch (action) {
            case 'duplicate':
                const duplicatedWeek = {
                    ...weeks[weekIndex],
                    id: Date.now().toString(),
                    name: `${weeks[weekIndex].name} (Copy)`,
                    days: weeks[weekIndex].days.map(day => ({
                        ...day,
                        id: Date.now().toString() + Math.random(),
                        exercises: [...day.exercises]
                    }))
                };
                updatedWeeks.splice(weekIndex + 1, 0, duplicatedWeek);
                break;
            case 'delete':
                updatedWeeks.splice(weekIndex, 1);
                break;
            case 'rename':
                setEditingWeek(weekId);
                break;
        }
        setWeeks(updatedWeeks);
        setShowWeekDropdown(null);
    };

    const handleWeekRename = (weekId: string, newName: string) => {
        const weekIndex = weeks.findIndex(w => w.id === weekId);
        if (weekIndex === -1) return;

        const updatedWeeks = [...weeks];
        updatedWeeks[weekIndex].name = newName;
        setWeeks(updatedWeeks);
        setEditingWeek(null);
    };

    const handleDayAction = (weekId: string, dayId: string, action: 'delete' | 'rename') => {
        const weekIndex = weeks.findIndex(w => w.id === weekId);
        if (weekIndex === -1) return;

        const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const updatedWeeks = [...weeks];
        switch (action) {
            case 'delete':
                updatedWeeks[weekIndex].days.splice(dayIndex, 1);
                break;
            case 'rename':
                setEditingDay({ weekId, dayId });
                break;
        }
        setWeeks(updatedWeeks);
        setShowDayDropdown(null);
    };

    const handleDayRename = (weekId: string, dayId: string, newName: string) => {
        const weekIndex = weeks.findIndex(w => w.id === weekId);
        if (weekIndex === -1) return;

        const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return;

        const updatedWeeks = [...weeks];
        updatedWeeks[weekIndex].days[dayIndex].name = newName;
        setWeeks(updatedWeeks);
        setEditingDay(null);
    };

    const handleAddExercise = (exercise: Exercise) => {
        if (!selectedDay) return;

        const weekIndex = weeks.findIndex(w => w.days.some(d => d.id === selectedDay.id));
        if (weekIndex === -1) return;

        const dayIndex = weeks[weekIndex].days.findIndex(d => d.id === selectedDay.id);
        if (dayIndex === -1) return;

        const updatedWeeks = [...weeks];
        updatedWeeks[weekIndex].days[dayIndex].exercises.push(exercise);
        setWeeks(updatedWeeks);
        setShowExerciseModal(false);
        setSelectedDay(null);
    };

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
                    {weeks.map((week) => (
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
                                                {day.exercises.map((exercise) => (
                                                    <div key={exercise.id} className="bg-white rounded-lg p-4 shadow">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h5 className="text-base font-medium text-gray-900">{exercise.name}</h5>
                                                            <button
                                                                onClick={() => {
                                                                    // TODO: Implement exercise actions
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded"
                                                            >
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {exercise.targetTypes.map((type) => (
                                                                <div key={type} className="text-sm text-gray-600">
                                                                    {type}: {exercise.values[type]}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
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
                }}
                onAddExercise={handleAddExercise}
            />
        </div>
    );
} 