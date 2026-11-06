import { api } from './api';
import type { User } from '../types';

export interface AuthResponseData {
  user: User;
  token: string;
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
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const res = await api.post('/auth/login', payload);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },

  async refresh(): Promise<string> {
    const res = await api.post('/auth/refresh');
    return res.data.data.token;
  },
};
