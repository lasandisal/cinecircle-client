import { api } from './api';
import { cachedGet, invalidateCache } from './requestCache';

export interface GroupSessionDetail {
  _id: string;
  name?: string;
  joinCode: string;
  creatorId: string;
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
  async createSession(data: {
    name?: string;
    maxRuntime?: number;
    moodFilter?: string;
    shortlistTitleIds?: string[];
    selectedParticipantIds?: string[];
  }): Promise<{ session: GroupSessionDetail; joinCode: string }> {
    const res = await api.post('/sessions/create', data);
    invalidateCache(['/sessions/active']);
    return res.data.data;
  },

  /**
   * Get session by 6-character room code
   */
  async getSessionByCode(joinCode: string): Promise<{ session: GroupSessionDetail; votes: any[] }> {
    const res = await cachedGet(`/sessions/code/${joinCode}`, undefined, { ttlMs: 10_000, staleWhileRevalidateMs: 10_000 });
    return res.data.data;
  },

  /**
   * Join session by code
   */
  async joinSession(joinCode: string): Promise<{ session: GroupSessionDetail; votes?: any[] }> {
    const res = await api.post('/sessions/join', { joinCode });
    invalidateCache(['/sessions/active', `/sessions/code/${joinCode}`]);
    return res.data.data;
  },

  /**
   * Read-only snapshot of a room (session + votes) that bypasses the GET cache.
   * Used as a fallback when a realtime broadcast was missed.
   */
  async fetchSessionSnapshot(
    joinCode: string
  ): Promise<{ session: GroupSessionDetail; votes: any[] }> {
    const res = await api.get(`/sessions/code/${encodeURIComponent(joinCode)}`);
    return res.data.data;
  },

  async inviteMembers(sessionId: string, memberIds: string[]): Promise<{ invitedCount: number }> {
    const res = await api.post(`/sessions/${sessionId}/invitations`, { memberIds });
    invalidateCache([`/sessions/code/`, '/users/notifications']);
    return res.data.data;
  },

  async respondToInvitation(
    invitationId: string,
    status: 'accepted' | 'rejected'
  ): Promise<{ status: 'accepted' | 'rejected'; joinCode: string }> {
    const res = await api.post(`/sessions/invitations/${invitationId}/respond`, { status });
    invalidateCache(['/users/notifications']);
    return res.data.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/sessions/${sessionId}`);
    invalidateCache(['/sessions/active', '/sessions/code/']);
  },

  async reopenSession(sessionId: string): Promise<{ session: GroupSessionDetail; votes: any[] }> {
    const res = await api.post(`/sessions/${sessionId}/reopen`);
    invalidateCache(['/sessions/active', '/sessions/code/']);
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
    invalidateCache(['/sessions/active', '/sessions/code/']);
    return res.data.data;
  },

  /**
   * Remove a title from session shortlist
   */
  async removeTitleFromShortlist(sessionId: string, titleId: string): Promise<GroupSessionDetail> {
    const res = await api.delete(`/sessions/${sessionId}/shortlist/${titleId}`);
    invalidateCache(['/sessions/active', '/sessions/code/']);
    return res.data.data.session;
  },

  /**
   * Submit reaction vote.
   * Returns the full vote list so callers can reconcile without polling.
   */
  async submitVote(
    sessionId: string,
    titleId: string,
    reaction: 'yes' | 'no',
    strength = 3
  ): Promise<{ vote: any; votes: any[] }> {
    const res = await api.post(`/sessions/${sessionId}/vote`, { titleId, reaction, strength });
    invalidateCache(['/sessions/active', '/sessions/code/']);
    return res.data.data;
  },

  /**
   * Lock winning pick.
   * Also returns the compromise scores and the AI pitch so the room does not
   * have to fetch them separately.
   */
  async lockSession(
    sessionId: string
  ): Promise<{
    session: GroupSessionDetail;
    winnerId?: string;
    scores: { titleId: string; score: number; yesCount: number; noCount: number }[];
    aiPitch?: string;
    aiPitchGenerated: boolean;
  }> {
    const res = await api.post(`/sessions/${sessionId}/lock`);
    invalidateCache(['/sessions/active', '/sessions/code/']);
    return res.data.data;
  },
};
