import { api } from './api';
import { cachedGet, invalidateCache } from './requestCache';
import type { UserProfileData, CommunityPerson, ConnectionGraph } from '../types';

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  handle?: string;
  avatar?: string;
  subscribedServices?: string[];
  favoriteGenres?: string[];
  exclusions?: string[];
  favoriteTitles?: string[];
}

export const userService = {
  /**
   * Fetch the current member's taste profile, computing recency-weighted genre
   * affinities on first call.
   * GET /api/users/taste-profile
   */
  async getTasteProfile(): Promise<{
    favoriteGenres: string[];
    favoriteTitles: string[];
    exclusions: string[];
    genreScores: Record<string, number>;
    tasteComputedAt?: string;
  }> {
    const res = await cachedGet('/users/taste-profile', undefined, { ttlMs: 60_000, staleWhileRevalidateMs: 60_000 });
    return res.data.data.tasteProfile;
  },

  /**
   * Get user profile (current user or target user by ID)
   */
  async getProfile(userId?: string): Promise<UserProfileData> {
    const endpoint = userId && userId !== 'me' ? `/users/${userId}/profile` : '/users/profile';
    const res = await cachedGet(endpoint, undefined, { ttlMs: 60_000, staleWhileRevalidateMs: 60_000 });
    return res.data.data.profile;
  },

  /**
   * Update profile fields (name, bio, handle, avatar, subscribedServices)
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<any> {
    const res = await api.put('/users/profile', payload);
    invalidateCache(['/users/profile', '/users/taste-profile', '/auth/me']);
    return res.data.data.user;
  },

  /**
   * Upload a profile image.
   * POST /api/users/avatar (multipart/form-data, field name "avatar")
   *
   * The server validates the bytes (magic number + 5 MB cap) before storing
   * them, so the browser cannot pass an arbitrary file off as an image.
   */
  async uploadAvatar(file: File): Promise<string> {
    const form = new FormData();
    form.append('avatar', file);
    const res = await api.post('/users/avatar', form);
    invalidateCache(['/users/profile', '/auth/me']);
    return res.data.data.url;
  },

  /**
   * Search real community members / Find more people
   */
  async searchPeople(query = ''): Promise<CommunityPerson[]> {
    const res = await cachedGet('/users/search', { params: { q: query } }, { ttlMs: 60_000, staleWhileRevalidateMs: 60_000 });
    return res.data.data.people || [];
  },

  /**
   * Toggle follow/unfollow a user
   */
  async requestConnection(targetUserId: string): Promise<{ status: 'pending_sent' }> {
    const res = await api.post('/users/connections/request', { targetUserId });
    return res.data.data;
  },

  async respondToConnection(
    requestId: string,
    status: 'accepted' | 'rejected'
  ): Promise<{ status: 'accepted' | 'rejected' }> {
    const res = await api.post('/users/connections/respond', { requestId, status });
    return res.data.data;
  },

  /**
   * Full social graph: who a member follows, who follows them, and the
   * two-way intersection (real connections).
   */
  async getConnections(userId?: string): Promise<ConnectionGraph> {
    const endpoint = userId && userId !== 'me' ? `/users/${userId}/connections` : '/users/connections';
    const res = await cachedGet(endpoint, undefined, { ttlMs: 60_000, staleWhileRevalidateMs: 60_000 });
    return res.data.data;
  },

  /**
   * Update taste preferences
   */
  async updateTasteProfile(data: { favoriteGenres?: string[]; exclusions?: string[]; favoriteTitles?: string[] }): Promise<any> {
    const res = await api.put('/users/taste-profile', data);
    invalidateCache(['/users/taste-profile', '/recommendations']);
    return res.data.data.tasteProfile;
  },

  /**
   * Update subscribed streaming services
   */
  async updateSubscribedServices(services: string[]): Promise<string[]> {
    const res = await api.put('/users/subscribed-services', { services });
    invalidateCache(['/users/profile', '/users/taste-profile', '/recommendations']);
    return res.data.data.subscribedServices;
  },

  /**
   * Complete First-Time Onboarding Wizard
   */
  async completeOnboarding(payload: {
    favoriteGenres: string[];
    favoriteTitles?: string[];
    exclusions?: string[];
    subscribedServices?: string[];
  }): Promise<{ user: any; tasteProfile: any }> {
    const res = await api.post('/users/onboarding', payload);
    invalidateCache(['/users/profile', '/users/taste-profile', '/auth/me', '/recommendations']);
    return res.data.data;
  },

  /**
   * Get real notifications for current user
   */
  async getNotifications(): Promise<any[]> {
    const res = await cachedGet('/users/notifications', undefined, { ttlMs: 30_000, staleWhileRevalidateMs: 30_000 });
    return res.data.data.notifications || [];
  },
};
