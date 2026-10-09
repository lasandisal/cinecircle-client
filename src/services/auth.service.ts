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
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
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
