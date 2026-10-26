import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api' });
api.interceptors.request.use((config) => { const token = localStorage.getItem('admin_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
