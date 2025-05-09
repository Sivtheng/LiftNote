'use client';

import { useState } from 'react';

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddExercise: (exercise: Exercise) => void;
}

interface Exercise {
    id: string;
    name: string;
    targetTypes: string[];
    values: { [key: string]: number };
    description?: string;
    videoLink?: string;
}

type ExerciseValues = {
    [key: string]: number;
};

export default function ExerciseModal({ isOpen, onClose, onAddExercise }: ExerciseModalProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newExercise, setNewExercise] = useState({
        name: '',
        targetTypes: ['sets', 'reps'],
        values: { sets: 3, reps: 10 } as ExerciseValues,
        description: '',
        videoLink: ''
    });

    if (!isOpen) return null;

    const handleCreateExercise = () => {
        const exercise: Exercise = {
            id: Date.now().toString(),
            ...newExercise
        };
        onAddExercise(exercise);
        setIsCreating(false);
        setNewExercise({
            name: '',
            targetTypes: ['sets', 'reps'],
            values: { sets: 3, reps: 10 } as ExerciseValues,
            description: '',
            videoLink: ''
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isCreating ? 'Create New Exercise' : 'Add Exercise'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!isCreating ? (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Exercises
                                </label>
                                <input
                                    type="text"
                                    id="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                                    placeholder="Search for exercises..."
                                />
                            </div>

                            {/* Search Results */}
                            <div className="space-y-4">
                                {/* TODO: Add search results here */}
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full py-3 text-center text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    + Create New Exercise
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Exercise Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={newExercise.name}
                                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                                    placeholder="Enter exercise name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Types
                                </label>
                                <div className="space-y-2">
                                    {newExercise.targetTypes.map((type, index) => (
                                        <div key={type} className="flex items-center space-x-4">
                                            <input
                                                type="number"
                                                value={newExercise.values[type]}
                                                onChange={(e) => setNewExercise({
                                                    ...newExercise,
                                                    values: { ...newExercise.values, [type]: parseInt(e.target.value) }
                                                })}
                                                className="block w-24 px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                                                placeholder="0"
                                            />
                                            <span className="text-gray-700">{type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    value={newExercise.description}
                                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                                    rows={3}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                                    placeholder="Enter exercise description"
                                />
                            </div>

                            <div>
                                <label htmlFor="videoLink" className="block text-sm font-medium text-gray-700 mb-2">
                                    YouTube Video Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    id="videoLink"
                                    value={newExercise.videoLink}
                                    onChange={(e) => setNewExercise({ ...newExercise, videoLink: e.target.value })}
                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>

                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateExercise}
                                    className="px-6 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Create Exercise
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 