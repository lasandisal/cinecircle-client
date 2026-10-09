import { api } from './api';
import type { FeedPostProps } from '../components/social/SocialFeedPost';
import type { GroupPollProps } from '../components/social/GroupSessionCard';

export interface UserSuggestion {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  matchScore: number;
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
  async getFeed(page = 1, limit = 10): Promise<FeedPostProps[]> {
    const res = await api.get('/titles/feed', { params: { page, limit } });
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
      featuredPoll = {
        id: first._id,
        roomName: first.name || 'Watch Decision Poll',
        joinCode: first.joinCode,
        hostName: first.host?.name || 'Host',
        participants: (first.participants || []).map((p: any) => ({
          name: p.name || 'Participant',
          avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'P')}&background=4f46e5&color=fff`,
        })),
        candidates: (first.shortlist || []).map((c: any, idx: number) => ({
          id: c._id,
          title: c.name,
          poster: c.posterUrl,
          scorePercent: 70 + ((idx * 11) % 25),
          isLeader: idx === 0,
        })),
        status: first.status === 'open' ? 'voting' : 'locked',
        aiCompromisePitch:
          'Our circle wanted high intensity combined with great craftsmanship. This candidate is the definitive compromise winner — settle in, the debate is officially resolved!',
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
