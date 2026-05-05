import axios from 'axios';

let envUrl = import.meta.env.VITE_API_URL;
if (envUrl && envUrl.includes('pruebas-marvelsa.vercel.app')) {
    envUrl = 'https://rock-launch-backend.vercel.app';
}
export const BASE_API_URL = envUrl || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://rock-launch-backend.vercel.app');

const api = axios.create({
    baseURL: `${BASE_API_URL}/api/`,
});

// Interceptor para añadir la API KEY de Admin en los requests si está disponible
api.interceptors.request.use((config) => {
    const fallbackKey = 'G6JnE+b4kCjuQReK2Ol141avlglX6qE+1m9plbz96V5zHjyK0zeVwrm13bAahfgd';
    const adminKey = import.meta.env.VITE_ADMIN_API_KEY || localStorage.getItem('admin_api_key') || fallbackKey;
    if (adminKey) {
        config.headers['X-API-Key'] = adminKey;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
