import { api } from './common';

export type LoginPayload = { username: string; password: string };
export type AuthUser = {
  userId: number;
  username: string;
  fullName: string | null;
  email?: string | null;
  phone?: string | null;
  roleCode?: string;
  roleName?: string;
  isActive?: boolean;
};

export const authService = {
  login(payload: LoginPayload) {
    return api.post('/api/auth/login', payload);
  },
  me() {
    return api.get<AuthUser>('/api/auth/me');
  },
  logout() {
    return Promise.resolve();
  },
};
