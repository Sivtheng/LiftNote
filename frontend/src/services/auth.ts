'use client';

import { LoginCredentials, LoginResponse } from '@/types/auth';

const API_URL = 'http://localhost:8000/api';
const SANCTUM_COOKIE_URL = 'http://localhost:8000';

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
    async getCsrfToken(): Promise<void> {
        if (!isClient) return;
        
        try {
            console.log('Fetching CSRF token from:', `${SANCTUM_COOKIE_URL}/sanctum/csrf-cookie`);
            const response = await fetch(`${SANCTUM_COOKIE_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                mode: 'cors',
            });
            
            console.log('CSRF Response Status:', response.status);
            console.log('CSRF Response Headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const text = await response.text();
                console.error('CSRF Error Response:', text);
                throw new Error(`Failed to fetch CSRF token: ${response.status}`);
            }

            // Get the XSRF-TOKEN cookie
            const cookies = document.cookie.split(';');
            const xsrfToken = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
            console.log('Cookies after CSRF request:', document.cookie);
            console.log('Found XSRF-TOKEN:', xsrfToken);
            
            if (!xsrfToken) {
                throw new Error('XSRF-TOKEN cookie not set');
            }
            
            // Wait a bit to ensure cookie is set
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            throw error;
        }
    },

    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        if (!isClient) throw new Error('Login can only be performed on the client side');
        
        try {
            console.log('Starting login process...');
            
            // Get CSRF cookie first
            await this.getCsrfToken();
            
            // Get the XSRF-TOKEN cookie value
            const xsrfToken = document.cookie
                .split(';')
                .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            if (!xsrfToken) {
                throw new Error('XSRF-TOKEN not found in cookies');
            }

            console.log('Attempting login with credentials:', {
                email: credentials.email,
                password: '********'
            });

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken)
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify(credentials),
            });

            console.log('Login Response Status:', response.status);
            console.log('Login Response Headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('Raw Response:', responseText);

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

            console.log('Login Response Data:', data);

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
            console.log('Starting logout process...');
            
            // Get CSRF cookie first
            await this.getCsrfToken();
            
            // Get the XSRF-TOKEN cookie value
            const xsrfToken = document.cookie
                .split(';')
                .find(cookie => cookie.trim().startsWith('XSRF-TOKEN='))
                ?.split('=')[1];

            if (!xsrfToken) {
                throw new Error('XSRF-TOKEN not found in cookies');
            }

            const token = localStorage.getItem('token');
            console.log('Attempting logout...');

            const response = await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                mode: 'cors',
            });

            console.log('Logout Response Status:', response.status);
            console.log('Logout Response Headers:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('Raw Logout Response:', responseText);

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || 'Failed to logout');
                } catch (e) {
                    console.error('Error parsing logout response:', e);
                    throw new Error('Failed to logout');
                }
            }

            localStorage.removeItem('token');
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
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
                credentials: 'include',
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