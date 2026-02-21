import axios from 'axios';

// ── Core API (Express, Port 5000) ─────────────────────────────────────────
export const coreApi = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Analytics API (FastAPI, Port 8000) ───────────────────────────────────
export const analyticsApi = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth Token Injection ──────────────────────────────────────────────────
const injectToken = (config) => {
  const token = localStorage.getItem('fleetflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

coreApi.interceptors.request.use(injectToken);

// ── Response Error Interceptor ────────────────────────────────────────────
const handleError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('fleetflow_token');
    localStorage.removeItem('fleetflow_user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

coreApi.interceptors.response.use((r) => r, handleError);
analyticsApi.interceptors.response.use((r) => r, handleError);

export default coreApi;
