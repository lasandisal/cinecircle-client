import { api } from './api';
import type { UserProfileData, CommunityPerson } from '../types';

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  handle?: string;
  avatar?: string;
  subscribedServices?: string[];
}

export const userService = {
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
  async toggleFollow(targetUserId: string): Promise<{ following: boolean }> {
    const res = await api.post('/users/follow', { targetUserId });
    return res.data.data;
  },

  /**
   * Update taste preferences
   */
  async updateTasteProfile(data: { favoriteGenres?: string[]; exclusions?: string[] }): Promise<any> {
    const res = await api.put('/users/taste-profile', data);
    return res.data.data.tasteProfile;
  },
};
