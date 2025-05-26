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
    weeks: ProgramWeek[];
    progress_logs: ProgressLog[];
    comments: Comment[];
    completed_weeks: number;
    total_weeks: number;
    created_at: string;
    updated_at: string;
}

export interface ProgramWeek {
    id: number;
    program_id: number;
    name: string;
    order: number;
    days: ProgramDay[];
}

export interface ProgramDay {
    id: number;
    week_id: number;
    name: string;
    order: number;
    exercises: ProgramDayExercise[];
}

export interface ProgramDayExercise {
    id: number;
    program_day_id: number;
    exercise_id: number;
    sets: number;
    reps?: number;
    time_seconds?: number;
    measurement_type: 'rpe' | 'kg';
    measurement_value: number;
    exercise: Exercise;
}

export interface Exercise {
    id: number;
    name: string;
    target_type: 'reps' | 'time';
    description?: string;
    video_link?: string;
    created_by: number;
    creator?: {
        name: string;
    };
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
    media_type: 'text' | 'video' | 'image';
    media_url: string | null;
    user_id: number;
    program_id: number;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    replies?: Comment[];
} 