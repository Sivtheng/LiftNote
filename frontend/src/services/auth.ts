'use client';

import { LoginCredentials, LoginResponse } from '@/types/auth';

const API_URL = 'https://api-liftnote.xyz/api';

const isClient = typeof window !== 'undefined';

// Add this function to handle API responses
const handleApiResponse = async (response: Response, router?: any) => {
    if (response.status === 401) {
        // Clear token and auth state on 401 (Unauthorized)
        localStorage.removeItem('token');
        if (router) {
            router.push('/login');
        }
        throw new Error('Session expired. Please login again.');
    }
    return response;
};

export const authService = {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        if (!isClient) throw new Error('Login can only be performed on the client side');
        
        try {

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(credentials),
            });

            const responseText = await response.text();

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || 'Failed to login');
                } catch (e) {
                    console.error('Error parsing error response:', e);
                    throw new Error('Invalid server response');
                }
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing success response:', e);
                throw new Error('Invalid JSON response from server');
            }

            // Verify user is a coach
            if (data.user.role !== 'coach') {
                throw new Error('Only coaches can access this platform');
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async logout(): Promise<void> {
        if (!isClient) throw new Error('Logout can only be performed on the client side');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // If there's no token, just clear local storage
                localStorage.removeItem('token');
                return;
            }

            const response = await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': `Bearer ${token}`
                },
            });

        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage, regardless of what happens
            localStorage.removeItem('token');
        }
    },

    // Add a new method to check auth status
    async checkAuthStatus(): Promise<boolean> {
        if (!isClient) return false;
        
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            const response = await fetch(`${API_URL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    return false;
                }
                throw new Error('Failed to verify auth status');
            }

            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }
};