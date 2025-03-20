export interface Question {
    id: number;
    key: string;
    question: string;
    type: string;
    options: string[] | null;
    is_required: boolean;
    order: number;
} 