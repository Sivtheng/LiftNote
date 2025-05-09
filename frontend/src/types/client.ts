export interface Client {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Questionnaire {
    id: number;
    user_id: number;
    answers: Record<string, string>;
    created_at: string;
    updated_at: string;
} 