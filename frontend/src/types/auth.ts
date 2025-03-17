export interface LoginCredentials {
    email: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'coach' | 'client' | 'admin';
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
}

export interface LoginResponse {
    message: string;
    user: User;
    token: string;
    expires_at: string;
}