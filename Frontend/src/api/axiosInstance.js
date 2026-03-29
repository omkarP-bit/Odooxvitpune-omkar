import axios from 'axios';

/* ── Main Backend (port 5000 via Vite proxy) ── */
export const mainApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
mainApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('rf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
mainApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rf_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* ── OCR Service (port 3001 via Vite proxy) ── */
export const ocrApi = axios.create({
  baseURL: '/ocr/api/ocr',
});

// OCR doesn't need JWT, but keep Content-Type flexible for multipart
ocrApi.interceptors.request.use((config) => config);
