import axios from 'axios';

const BACKEND_URL = 'https://rock-launch-backend-opal.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Validate VITE_API_URL — reject it if it points to the frontend host or wrong project
const envUrl = import.meta.env.VITE_API_URL;
const isValidBackendUrl = envUrl && envUrl.includes('rock-launch-backend');

export const BASE_API_URL = isValidBackendUrl
    ? envUrl
    : (window.location.hostname === 'localhost' ? LOCAL_URL : BACKEND_URL);

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
