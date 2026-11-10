import { api } from './api';
import type { UserProfileData, CommunityPerson, ConnectionGraph } from '../types';

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  handle?: string;
  avatar?: string;
  subscribedServices?: string[];
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
    const res = await api.get('/users/taste-profile');
    return res.data.data.tasteProfile;
  },

  /**
   * Get user profile (current user or target user by ID)
   */
  async getProfile(userId?: string): Promise<UserProfileData> {
    const endpoint = userId && userId !== 'me' ? `/users/${userId}/profile` : '/users/profile';
    const res = await api.get(endpoint);
    return res.data.data.profile;
  },

  /**
   * Update profile fields (name, bio, handle, avatar, subscribedServices)
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<any> {
    const res = await api.put('/users/profile', payload);
    return res.data.data.user;
  },

  /**
   * Search real community members / Find more people
   */
  async searchPeople(query = ''): Promise<CommunityPerson[]> {
    const res = await api.get('/users/search', { params: { q: query } });
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
    const res = await api.get(endpoint);
    return res.data.data;
  },

  /**
   * Update taste preferences
   */
  async updateTasteProfile(data: { favoriteGenres?: string[]; exclusions?: string[]; favoriteTitles?: string[] }): Promise<any> {
    const res = await api.put('/users/taste-profile', data);
    return res.data.data.tasteProfile;
  },

  /**
   * Update subscribed streaming services
   */
  async updateSubscribedServices(services: string[]): Promise<string[]> {
    const res = await api.put('/users/subscribed-services', { services });
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
    return res.data.data;
  },

  /**
   * Get real notifications for current user
   */
  async getNotifications(): Promise<any[]> {
    const res = await api.get('/users/notifications');
    return res.data.data.notifications || [];
  },
};
