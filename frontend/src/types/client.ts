export interface Client {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    bio?: string;
    profile_picture?: string;
}

export interface Questionnaire {
    id: number;
    client_id: number;
    status: string;
    answers: Record<string, string>;
} 