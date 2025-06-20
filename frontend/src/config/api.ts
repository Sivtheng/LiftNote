// API Configuration
export const API_CONFIG = {
    BASE_URL: 'https://api-liftnote.xyz/api',
    HEADERS: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
};

// Helper function to get auth headers
export const getAuthHeaders = (token: string) => ({
    ...API_CONFIG.HEADERS,
    'Authorization': `Bearer ${token}`
});

// Helper function to make authenticated API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const headers = getAuthHeaders(token);

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}; 