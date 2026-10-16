import { api } from './api';
import type { FeedPostProps } from '../components/social/SocialFeedPost';
import type { GroupPollProps } from '../components/social/GroupSessionCard';

export interface UserSuggestion {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  /** Real compatibility 0-100, or null when there is no shared signal yet. */
  matchScore: number | null;
  matchExplanation: string;
  mutualCount: number;
}

export interface ActiveCircleItem {
  id: string;
  name: string;
  joinCode: string;
  hostName: string;
  hostAvatar: string;
  participantsCount: number;
  genre: string;
  isLive: boolean;
}

export const socialService = {
  /**
   * Get live community feed posts and discussion polls from MongoDB
   */
  /**
   * Get live community feed posts and discussion polls from MongoDB.
   *
   * `filter: 'following'` is a real server-side restriction to people the
   * viewer actually follows - previously the "Following Activity" tab sent no
   * filter and received the identical global feed.
   */
  async getFeed(page = 1, limit = 10, filter: 'all' | 'following' = 'all'): Promise<FeedPostProps[]> {
    const res = await api.get('/titles/feed', { params: { page, limit, filter } });
    return res.data.data.posts || [];
  },

  /**
   * Get active decision circles/rooms
   */
  async getActiveSessions(): Promise<{ raw: any[]; display: ActiveCircleItem[]; featuredPoll?: GroupPollProps }> {
    const res = await api.get('/sessions/active');
    const sessions = res.data.data.sessions || [];

    const display: ActiveCircleItem[] = sessions.map((s: any) => ({
      id: s._id,
      name: s.name || 'Watch Decision Party',
      joinCode: s.joinCode,
      hostName: s.host?.name || 'Host',
      hostAvatar: s.host?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.host?.name || 'H')}&background=6366f1&color=fff`,
      participantsCount: s.participants?.length || 1,
      genre: s.constraints?.moodFilter || 'Featured',
      isLive: s.status === 'open',
    }));

    let featuredPoll: GroupPollProps | undefined;
    if (sessions.length > 0) {
      const first = sessions[0];
      const shortlist: any[] = first.shortlist || [];
      const tally: any[] = first.voteTally || [];
      const tallyByTitle = new Map(tally.map((t) => [t.titleId, t]));

      // Leader = highest real net score, not simply the first array entry.
      const leaderTitleId = tally.length
        ? tally.slice().sort((a, b) => b.netScore - a.netScore)[0].titleId
        : null;

      featuredPoll = {
        id: first._id,
        roomName: first.name || 'Watch Decision Poll',
        joinCode: first.joinCode,
        hostName: first.host?.name || 'Host',
        participants: (first.participants || []).map((p: any) => ({
          name: p.name || 'Participant',
          avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'P')}&background=4f46e5&color=fff`,
        })),
        candidates: shortlist.map((c: any) => {
          const t = tallyByTitle.get(c._id);
          return {
            id: c._id,
            title: c.name,
            poster: c.posterUrl,
            // Real percentage of participants who voted yes.
            scorePercent: t ? t.yesPercent : 0,
            yesCount: t ? t.yes : 0,
            noCount: t ? t.no : 0,
            isLeader: leaderTitleId !== null && c._id === leaderTitleId,
          };
        }),
        status: first.status === 'open' ? 'voting' : 'locked',
        // No verdict before the host locks the room. It is generated at lock
        // time and returned by /sessions/:id/lock - previously this was a
        // fixed sentence shown on every open poll, presented as Gemini output.
        aiCompromisePitch: undefined,
      };
    }

    return { raw: sessions, display, featuredPoll };
  },

  /**
   * Get suggested users for taste matches
   */
  async getUserSuggestions(): Promise<UserSuggestion[]> {
    const res = await api.get('/users/suggestions');
    return res.data.data.users || [];
  },
};
