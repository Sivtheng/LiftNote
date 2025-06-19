import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Network configuration - Simplified for hosted database setup
const NETWORK = 'development';

const NETWORK_CONFIGS = {
    development: 'http://192.168.43.233:8000/api', // Your computer's IP address
    production: 'https://your-backend-domain.com/api', // Update with your production URL when deployed
};

// Use environment variable or fallback to network config
const API_URL = process.env.API_URL || NETWORK_CONFIGS[NETWORK];

console.log('Mobile app connecting to:', API_URL);

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
    updateProfile: async (userData: any) => {
        try {
            const response = await api.put('/profile', userData);
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },
    deleteAccount: async () => {
        try {
            await api.delete('/profile');
            await AsyncStorage.removeItem('token');
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    },
    requestPasswordReset: async (email: string) => {
        try {
            const response = await api.post('/forgot-password', { email });
            return response.data;
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    },
    resetPassword: async (token: string, password: string, passwordConfirmation: string) => {
        try {
            const response = await api.post('/reset-password', {
                token,
                password,
                password_confirmation: passwordConfirmation
            });
            return response.data;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    },
    changePassword: async (currentPassword: string, newPassword: string, passwordConfirmation: string) => {
        try {
            const response = await api.post('/change-password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: passwordConfirmation
            });
            return response.data;
        } catch (error) {
            console.error('Change password error:', error);
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
    addProgramComment: async (programId: string, content: string, parentId?: string) => {
        const response = await api.post(`/programs/${programId}/comments`, {
            content,
            parent_id: parentId
        });
        return response.data;
    },
    addProgramCommentWithMedia: async (programId: string, content: string, media?: {
        uri: string;
        type: string;
        name: string;
    } | null, parentId?: string) => {
        try {
            const formData = new FormData();
            
            if (content) {
                formData.append('content', content);
            }
            
            if (parentId) {
                formData.append('parent_id', parentId);
            }
            
            if (media) {
                // Determine the correct MIME type based on file extension
                let mimeType = 'image/jpeg'; // default
                if (media.type === 'video') {
                    mimeType = 'video/mp4';
                } else if (media.name) {
                    const extension = media.name.toLowerCase().split('.').pop();
                    switch (extension) {
                        case 'png':
                            mimeType = 'image/png';
                            break;
                        case 'gif':
                            mimeType = 'image/gif';
                            break;
                        case 'jpg':
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            break;
                        case 'mp4':
                            mimeType = 'video/mp4';
                            break;
                        case 'mov':
                            mimeType = 'video/quicktime';
                            break;
                        case 'avi':
                            mimeType = 'video/x-msvideo';
                            break;
                        default:
                            mimeType = media.type === 'video' ? 'video/mp4' : 'image/jpeg';
                    }
                }
                
                console.log('Preparing FormData upload for:', media.uri);
                
                // Create file object for FormData
                const fileData = {
                    uri: media.uri,
                    type: mimeType,
                    name: media.name,
                };
                
                formData.append('media_file', fileData as any);
                
                console.log('FormData prepared:', {
                    hasContent: !!content,
                    hasMedia: !!media,
                    hasParentId: !!parentId,
                    parentId: parentId,
                    mediaType: mimeType,
                    mediaName: media.name
                });
            }

            // Use a separate axios instance for FormData to avoid JSON headers
            const formDataApi = axios.create({
                baseURL: API_URL,
                headers: {
                    'Accept': 'application/json',
                    // Don't set Content-Type for FormData - let the browser set it with boundary
                },
            });

            // Add token to FormData requests
            formDataApi.interceptors.request.use(
                async (config) => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                        return config;
                    } catch (error) {
                        console.error('Error getting token for FormData:', error);
                        return config;
                    }
                },
                (error) => {
                    console.error('FormData request interceptor error:', error);
                    return Promise.reject(error);
                }
            );

            const response = await formDataApi.post(`/programs/${programId}/comments`, formData);
            
            return response.data;
        } catch (error: any) {
            console.error('Error adding comment with media:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
            throw error;
        }
    },
    updateComment: async (programId: string, commentId: string, content: string) => {
        const response = await api.put(`/programs/${programId}/comments/${commentId}`, {
            content
        });
        return response.data;
    },
    deleteComment: async (programId: string, commentId: string) => {
        const response = await api.delete(`/programs/${programId}/comments/${commentId}`);
        return response.data;
    },
    getRecentComments: async (programId: string) => {
        const response = await api.get(`/programs/${programId}/comments`);
        return response.data;
    },
    getCoachComments: async (programId: string) => {
        const response = await api.get(`/programs/${programId}/comments?role=coach`);
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