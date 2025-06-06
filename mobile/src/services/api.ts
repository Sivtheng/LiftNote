import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Switch between PCs by changing this boolean
const USE_PC_1 = false; // Set to false to use PC 2

// Use environment variable or fallback to localhost
const API_URL = process.env.API_URL || (USE_PC_1 
    ? 'http://192.168.43.233:8000/api'  // PC 1
    : 'http://192.168.43.42:8000/api'   // PC 2
);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            console.error('Error getting token:', error);
            return config;
        }
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            await AsyncStorage.removeItem('token');
            // You might want to redirect to login here
        }
        return Promise.reject(error);
    }
);

// Auth Services
export const authService = {
    login: async (email: string, password: string) => {
        try {
            const response = await api.post('/login', { email, password });
            if (response.data.token) {
                await AsyncStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    register: async (userData: any) => {
        const response = await api.post('/register', userData);
        await AsyncStorage.setItem('token', response.data.token);
        return response.data;
    },
    logout: async () => {
        try {
            await api.post('/logout');
            await AsyncStorage.removeItem('token');
        } catch (error) {
            console.error('Logout error:', error);
            // Still remove token even if logout fails
            await AsyncStorage.removeItem('token');
            throw error;
        }
    },
    getProfile: async () => {
        try {
            const response = await api.get('/profile');
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },
};

// Program Services
export const programService = {
    getClientPrograms: async () => {
        try {
            const response = await api.get('/programs/client');
            return response.data;
        } catch (error) {
            console.error('Get client programs error:', error);
            throw error;
        }
    },
    getProgram: async (programId: string) => {
        const response = await api.get(`/programs/${programId}`);
        return response.data;
    },
    markWeekComplete: async (programId: string, weekId: string) => {
        const response = await api.post(`/programs/${programId}/weeks/${weekId}/complete`);
        return response.data;
    },
};

// Progress Log Services
export const progressLogService = {
    createLog: async (programId: string, logData: any) => {
        const response = await api.post(`/programs/${programId}/progress`, logData);
        return response.data;
    },
    updateLog: async (logId: string, logData: any) => {
        const response = await api.put(`/progress-logs/${logId}`, logData);
        return response.data;
    },
    deleteLog: async (logId: string) => {
        await api.delete(`/progress-logs/${logId}`);
    },
    getProgramLogs: async (programId: string) => {
        const response = await api.get(`/programs/${programId}/progress`);
        return response.data;
    },
};

// Comment Services
export const commentService = {
    getProgramComments: async (programId: string) => {
        const response = await api.get(`/programs/${programId}/comments`);
        return response.data;
    },
    addProgramComment: async (programId: string, comment: string) => {
        const response = await api.post(`/programs/${programId}/comments`, { comment });
        return response.data;
    },
    getRecentComments: async (programId: string) => {
        const response = await api.get(`/programs/${programId}/comments`);
        return response.data;
    },
};

// Questionnaire Services
export const questionnaireService = {
    getQuestions: async () => {
        const response = await api.get('/questionnaires/mine');
        return response.data;
    },
    submitAnswers: async (answers: Record<string, string>) => {
        const response = await api.post('/questionnaires/submit', { answers });
        return response.data;
    },
};

export default api; 