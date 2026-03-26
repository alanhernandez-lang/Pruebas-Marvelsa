import axios from 'axios';

export const BASE_API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

const api = axios.create({
    baseURL: `${BASE_API_URL}/api/`,
});

// Interceptor para añadir la API KEY de Admin en los requests si está disponible
api.interceptors.request.use((config) => {
    const adminKey = import.meta.env.VITE_ADMIN_API_KEY || localStorage.getItem('admin_api_key');
    if (adminKey) {
        config.headers['X-API-Key'] = adminKey;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
