'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authService } from '@/services/auth';

export default function DashboardPage() {
    const router = useRouter();
    const [error, setError] = useState<string>('');

    const handleLogout = async () => {
        try {
            setError('');
            await authService.logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            setError(error instanceof Error ? error.message : 'Failed to logout');
        }
    };

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
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Welcome to your dashboard!</p>
                </div>
            </div>
        </div>
    );
} 