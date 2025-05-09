'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [error, setError] = useState<string>('');

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-black">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-black mb-8">Dashboard</h1>
                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}
                    {/* Dashboard content will be added here */}
                </div>
            </main>
        </div>
    );
} 