export interface Client {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
    created_at?: string;
    updated_at?: string;
    current_program?: {
        id: number;
        title: string;
        created_at: string;
        completed_weeks: number;
        total_weeks: number;
    };
}

export interface Questionnaire {
    id: number;
    user_id: number;
    answers: Record<string, string>;
    created_at: string;
    updated_at: string;
} 