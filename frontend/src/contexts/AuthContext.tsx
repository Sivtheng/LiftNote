'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Only run auth check on client side
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        const checkAuth = async () => {
            try {
                const isValid = await authService.checkAuthStatus();
                setIsAuthenticated(isValid);
                if (!isValid && window.location.pathname !== '/login') {
                    router.push('/login');
                } else if (isValid && window.location.pathname === '/login') {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
                if (window.location.pathname !== '/login') {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        // Check auth status periodically (every 5 minutes)
        const interval = setInterval(checkAuth, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [router]);

    const login = async (email: string, password: string) => {
        try {
            await authService.login({ email, password });
            setIsAuthenticated(true);
            router.push('/dashboard');
        } catch (error) {
            setIsAuthenticated(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            // Always set authenticated to false and redirect
            setIsAuthenticated(false);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 