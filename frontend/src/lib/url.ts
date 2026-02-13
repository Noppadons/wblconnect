
import { API_URL } from './api';

/**
 * Safely normalizes a URL path.
 * If the path is a full URL (starts with http/https), it returns it as is.
 * Otherwise, it prepends the API_URL.
 */
export const normalizeUrl = (path: string | null | undefined, isDownload: boolean = false): string => {
    if (!path) return '';
    let finalUrl = '';

    if (path.startsWith('http://') || path.startsWith('https://')) {
        finalUrl = path;
    } else {
        // Extract base URL from API_URL (remove trailing /api)
        const baseUrl = API_URL.replace(/\/api$/, '');

        // If it's a local upload path, use the base URL without /api
        if (path.startsWith('/uploads') || path.startsWith('uploads')) {
            const cleanPath = path.startsWith('/') ? path : `/${path}`;
            finalUrl = `${baseUrl}${cleanPath}`;
        } else {
            // Default to API_URL prefix for other relative paths
            finalUrl = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
        }
    }

    // If download is requested and it's a Supabase URL, append download query param
    if (isDownload && finalUrl.includes('supabase.co')) {
        finalUrl += finalUrl.includes('?') ? '&download=' : '?download=';
    }

    return finalUrl;
};
