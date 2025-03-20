export interface Program {
    id: number;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'cancelled';
    coach_id: number;
    client_id: number;
    coach?: {
        name: string;
        email?: string;
    };
    client?: {
        name: string;
        email?: string;
    };
    progress_logs: ProgressLog[];
    comments: Comment[];
}

export interface ProgressLog {
    id: number;
    title: string;
    description: string;
    date: string;
    client_id?: number;
    program_id?: number;
    comments: Comment[];
}

export interface Comment {
    id: number;
    content: string;
    user_id?: number;
    program_id?: number;
    progress_log_id?: number;
    user: {
        name: string;
    };
    created_at?: string;
} 