import { api } from './api';

export interface GroupSessionDetail {
  _id: string;
  name?: string;
  joinCode: string;
  host: { _id: string; name: string; email: string; avatar?: string };
  participants: { _id: string; name: string; email: string; avatar?: string }[];
  constraints?: { maxRuntime?: number; moodFilter?: string };
  shortlist: any[];
  status: 'open' | 'closed';
  finalPick?: any;
  createdAt: string;
}

export const sessionService = {
  /**
   * Create a new group watch decision session
   */
  async createSession(data: { name?: string; maxRuntime?: number; moodFilter?: string; shortlistTitleIds?: string[] }): Promise<{ session: GroupSessionDetail; joinCode: string }> {
    const res = await api.post('/sessions/create', data);
    return res.data.data;
  },

  /**
   * Get session by 6-character room code
   */
  async getSessionByCode(joinCode: string): Promise<{ session: GroupSessionDetail; votes: any[] }> {
    const res = await api.get(`/sessions/code/${joinCode}`);
    return res.data.data;
  },

  /**
   * Join session by code
   */
  async joinSession(joinCode: string): Promise<{ session: GroupSessionDetail; votes?: any[] }> {
    const res = await api.post('/sessions/join', { joinCode });
    return res.data.data;
  },

  /**
   * Add a movie or show to session shortlist
   */
  async addTitleToShortlist(
    sessionId: string,
    data: { titleId?: string; tmdbId?: number; type?: 'film' | 'tv'; titleData?: any }
  ): Promise<{ session: GroupSessionDetail; votes: any[] }> {
    const res = await api.post(`/sessions/${sessionId}/shortlist`, data);
    return res.data.data;
  },

  /**
   * Remove a title from session shortlist
   */
  async removeTitleFromShortlist(sessionId: string, titleId: string): Promise<GroupSessionDetail> {
    const res = await api.delete(`/sessions/${sessionId}/shortlist/${titleId}`);
    return res.data.data.session;
  },

  /**
   * Submit reaction vote
   */
  async submitVote(sessionId: string, titleId: string, reaction: 'yes' | 'no', strength = 3): Promise<void> {
    await api.post(`/sessions/${sessionId}/vote`, { titleId, reaction, strength });
  },

  /**
   * Lock winning pick
   */
  async lockSession(sessionId: string): Promise<GroupSessionDetail> {
    const res = await api.post(`/sessions/${sessionId}/lock`);
    return res.data.data.session;
  },
};
