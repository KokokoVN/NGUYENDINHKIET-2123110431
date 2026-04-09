import axios from 'axios';

const TOKEN_KEY = 'hm_token';
const ROLE_KEY = 'hm_role';
const USER_KEY = 'hm_username';
const NAME_KEY = 'hm_fullname';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(NAME_KEY);
};

export const saveAuth = (token: string, role: string, username: string, fullName: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, username);
  localStorage.setItem(NAME_KEY, fullName);
};

export const readAuthMeta = () => ({
  role: localStorage.getItem(ROLE_KEY) ?? '',
  username: localStorage.getItem(USER_KEY) ?? '',
  fullName: localStorage.getItem(NAME_KEY) ?? '',
});

/** Để trống = gọi /api qua Vite proxy (dev). Hoặc .env: VITE_API_URL=http://localhost:5066 */
const baseURL = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  : '';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthStorage();
      if (!window.location.pathname.endsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function apiMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string };
    if (typeof d?.message === 'string') return d.message;
    if (err.response?.status === 401) return 'Phiên đăng nhập hết hạn.';
    return err.message || 'Lỗi mạng hoặc máy chủ.';
  }
  return 'Đã xảy ra lỗi.';
}
