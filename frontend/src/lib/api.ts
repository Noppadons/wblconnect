import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
export const API_URL = rawApiUrl
    ? (rawApiUrl.endsWith('/api') ? `${rawApiUrl}/v1` : `${rawApiUrl}/api/v1`)
    : '/api/v1'; // production sync — versioned API

const api = axios.create({
    baseURL: API_URL,
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

let isRefreshing = false;
let pendingQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(undefined);
    });
    pendingQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            originalRequest._retry = true;

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then(() => api(originalRequest));
            }

            isRefreshing = true;
            try {
                const res = await api.post('/auth/refresh');
                if (res.data?.user) {
                    sessionStorage.setItem('user', JSON.stringify(res.data.user));
                }
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Refresh failed — clear and redirect
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('user');
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
