export interface Program {
    id: number;
    title: string;
    created_at: string;
    completed_weeks: number;
    total_weeks: number;
    status: 'active' | 'completed' | 'cancelled';
}

export interface Client {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
    created_at?: string;
    updated_at?: string;
    client_programs?: Program[];
}

export interface Questionnaire {
    id: number;
    user_id: number;
    answers: Record<string, string>;
    created_at: string;
    updated_at: string;
} 