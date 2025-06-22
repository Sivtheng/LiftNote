'use client';

import { useState, useEffect } from 'react';

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

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExercise: (exercise: Exercise) => void;
    onEditExercise?: (exercise: Exercise) => void;
    dayId: string;
    editingExercise?: Exercise | null;
}

export default function ExerciseModal({ 
    isOpen, 
    onClose, 
    onAddExercise, 
    onEditExercise,
    dayId,
    editingExercise 
}: ExerciseModalProps) {
    const [name, setName] = useState('');
    const [sets, setSets] = useState('1');
    const [repTimeType, setRepTimeType] = useState<'reps' | 'time'>('reps');
    const [reps, setReps] = useState<number | undefined>(undefined);
    const [timeSeconds, setTimeSeconds] = useState<number | undefined>(undefined);
    const [measurementType, setMeasurementType] = useState<'rpe' | 'kg'>('kg');
    const [measurementValue, setMeasurementValue] = useState(0);
    const [description, setDescription] = useState('');
    const [videoLink, setVideoLink] = useState('');

    // Update form when editingExercise changes
    useEffect(() => {
        if (editingExercise) {
            setName(editingExercise.name);
            setSets(editingExercise.sets.toString());
            setRepTimeType(editingExercise.reps ? 'reps' : 'time');
            setReps(editingExercise.reps || undefined);
            setTimeSeconds(editingExercise.time_seconds || undefined);
            setMeasurementType(editingExercise.measurement_type);
            setMeasurementValue(editingExercise.measurement_value || 0);
            setDescription(editingExercise.description || '');
            setVideoLink(editingExercise.video_link || '');
        } else {
            resetForm();
        }
    }, [editingExercise]);

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const exerciseData = {
            id: editingExercise?.id || '',
            name,
            sets: parseInt(sets),
            reps: repTimeType === 'reps' ? reps : undefined,
            time_seconds: repTimeType === 'time' ? timeSeconds : undefined,
            measurement_type: measurementType,
            measurement_value: measurementValue,
            description,
            video_link: videoLink,
            day_id: dayId
        };

        if (editingExercise && onEditExercise) {
            onEditExercise(exerciseData);
        } else {
            onAddExercise(exerciseData);
        }
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setSets('1');
        setRepTimeType('reps');
        setReps(undefined);
        setTimeSeconds(undefined);
        setMeasurementType('kg');
        setMeasurementValue(0);
        setDescription('');
        setVideoLink('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div 
                    className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            {editingExercise ? 'Edit Exercise' : 'Add Exercise'}
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Exercise Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="sets" className="block text-sm font-medium text-gray-700">Sets</label>
                            <input
                                type="text"
                                id="sets"
                                value={sets}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Only allow numbers
                                    if (value === '' || /^\d+$/.test(value)) {
                                        setSets(value);
                                    }
                                }}
                                onBlur={(e) => {
                                    // Set fallback value when field loses focus
                                    if (e.target.value === '') {
                                        setSets('1');
                                    }
                                }}
                                placeholder="Enter number of sets"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="repTimeType" className="block text-sm font-medium text-gray-700">Rep/Time</label>
                            <select
                                id="repTimeType"
                                value={repTimeType}
                                onChange={(e) => setRepTimeType(e.target.value as 'reps' | 'time')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="reps">Reps</option>
                                <option value="time">Time (seconds)</option>
                            </select>
                        </div>

                        {repTimeType === 'reps' ? (
                            <div>
                                <label htmlFor="reps" className="block text-sm font-medium text-gray-700">Reps</label>
                                <input
                                    type="text"
                                    id="reps"
                                    value={reps ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow numbers
                                        if (value === '' || /^\d+$/.test(value)) {
                                            const numValue = value === '' ? undefined : parseInt(value);
                                            if (numValue === undefined || numValue >= 1) {
                                                setReps(numValue);
                                            }
                                        }
                                    }}
                                    placeholder="Enter number of reps"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                    required
                                />
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700">Time (seconds)</label>
                                <input
                                    type="text"
                                    id="time"
                                    value={timeSeconds ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow numbers
                                        if (value === '' || /^\d+$/.test(value)) {
                                            const numValue = value === '' ? undefined : parseInt(value);
                                            if (numValue === undefined || numValue >= 1) {
                                                setTimeSeconds(numValue);
                                            }
                                        }
                                    }}
                                    placeholder="Enter time in seconds"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="measurementType" className="block text-sm font-medium text-gray-700">RPE/KG</label>
                            <select
                                id="measurementType"
                                value={measurementType}
                                onChange={(e) => setMeasurementType(e.target.value as 'rpe' | 'kg')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                            >
                                <option value="kg">Weight (kg)</option>
                                <option value="rpe">RPE</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="measurementValue" className="block text-sm font-medium text-gray-700">
                                {measurementType === 'kg' ? 'Weight (kg)' : 'RPE Value'}
                            </label>
                            <input
                                type="text"
                                id="measurementValue"
                                value={measurementValue || 0}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow numbers and decimals
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        const numValue = value === '' ? 0 : parseFloat(value);
                                        if (!isNaN(numValue) && numValue >= 0) {
                                            setMeasurementValue(numValue);
                                        }
                                    }
                                }}
                                placeholder={measurementType === 'kg' ? 'Enter weight in kg' : 'Enter RPE value'}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (optional)</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                            />
                        </div>

                        <div>
                            <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700">Video Link (optional)</label>
                            <input
                                type="url"
                                id="videoLink"
                                value={videoLink}
                                onChange={(e) => setVideoLink(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                            />
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {editingExercise ? 'Save Changes' : 'Add Exercise'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 