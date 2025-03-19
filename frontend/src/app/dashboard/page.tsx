'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
    const [error, setError] = useState<string>('');

    const handleLogout = async () => {
        try {
            setError('');
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to logout');
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-black rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Logout
                    </button>
                </div>
                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Questionnaire Management</h2>
                        <p className="text-gray-600 mb-4">Manage the questionnaire questions for your clients.</p>
                        <button
                            onClick={() => router.push('/questionnaire')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Manage Questions
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">Client Responses</h2>
                        <p className="text-gray-600">View and manage client questionnaire responses.</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 