import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for HttpOnly cookies
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    // Note: Authorization header is no longer needed as we use HttpOnly cookies
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                // Clear user info from storage on auth failure
                localStorage.removeItem('user');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
