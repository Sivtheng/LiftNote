'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Navbar() {
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
                <div className="flex justify-between h-20">
                    {/* Left - Logo */}
                    <div className="flex items-center">
                        <Link
                            href="/dashboard"
                            className="text-3xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors cursor-pointer"
                        >
                            LiftNote
                        </Link>
                    </div>

                    {/* Middle - Navigation Links */}
                    <div className="flex items-center space-x-8">
                        <Link
                            href="/dashboard"
                            className="inline-block px-4 py-2 text-gray-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all duration-200 cursor-pointer"
                        >
                            Home
                        </Link>
                        <Link
                            href="/program"
                            className="inline-block px-4 py-2 text-gray-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all duration-200 cursor-pointer"
                        >
                            Programs
                        </Link>
                        <Link
                            href="/client"
                            className="inline-block px-4 py-2 text-gray-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all duration-200 cursor-pointer"
                        >
                            Clients
                        </Link>
                        <Link
                            href="/questionnaire"
                            className="inline-block px-4 py-2 text-gray-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all duration-200 cursor-pointer"
                        >
                            Questionnaire
                        </Link>
                    </div>

                    {/* Right - Settings and Logout */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/settings"
                            className="inline-block px-4 py-2 text-gray-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all duration-200 cursor-pointer"
                        >
                            Settings
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="inline-block px-4 py-2 text-gray-600 bg-white hover:bg-red-50 hover:text-red-600 rounded-md transition-all duration-200 cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
} 