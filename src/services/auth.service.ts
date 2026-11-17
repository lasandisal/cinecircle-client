import { api } from './api';
import { cachedGet } from './requestCache';
import type { User } from '../types';

export interface AuthResponseData {
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  otp: string;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
  otp?: string;
}

export const authService = {
  async sendOtp(email: string, type: 'register' | 'login' = 'register'): Promise<{ email: string; type: string; devCode?: string }> {
    const res = await api.post('/auth/send-otp', { email, type });
    return res.data.data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ verified: boolean; email: string }> {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    // The API sets an HttpOnly session cookie on success; no token is returned.
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const res = await api.post('/auth/login', payload);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const res = await cachedGet('/auth/me', undefined, { ttlMs: 60_000 });
    return res.data.data.user;
  },

  async refresh(): Promise<void> {
    await api.post('/auth/refresh');
  },
};
