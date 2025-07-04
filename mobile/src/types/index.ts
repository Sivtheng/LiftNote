export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'coach' | 'client';
}

export interface Program {
    id: number;
    name: string;
    description: string;
    weeks: Week[];
    created_at: string;
    updated_at: string;
}

export interface Week {
    id: number;
    program_id: number;
    name: string;
    order: number;
    is_complete: boolean;
    days: Day[];
}

export interface Day {
    id: number;
    week_id: number;
    name: string;
    order: number;
    exercises: Exercise[];
}

export interface Exercise {
    id: number;
    day_id: number;
    name: string;
    description: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
}

export interface ProgressLog {
    id: number;
    program_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    comments: Comment[];
}

export interface Comment {
    id: string;
    content: string;
    user: User;
    created_at: string;
    updated_at: string;
    replies?: Comment[];
} 