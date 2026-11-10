import { api } from './api';
import { cachedGet } from './requestCache';

export interface FlaggedComment {
  _id: string;
  text: string;
  rating?: number;
  likesCount?: number;
  createdAt: string;
  containsSpoilers?: boolean;
  reportCount: number;
  reportedAt?: string;
  hidden: boolean;
  user?: { _id: string; name: string; avatar?: string; handle?: string };
  title?: { _id: string; name: string; posterUrl?: string; releaseYear?: number };
  reports?: { user?: { _id: string; name: string }; reason?: string; createdAt: string }[];
}

export interface CuratorStats {
  openCount: number;
  resolvedCount: number;
  totalCuratedTracks: number;
}

export const curatorService = {
  /**
   * Fetch the moderation queue.
   * status: 'open'    -> reported, not yet actioned
   *         'resolved' -> previously hidden or dismissed
   */
  async getFlaggedComments(status: 'open' | 'resolved' = 'open'): Promise<{
    reportedComments: FlaggedComment[];
    openCount: number;
  }> {
    const res = await cachedGet('/curator/comments/flagged', { params: { status } }, { ttlMs: 30_000, staleWhileRevalidateMs: 30_000 });
    return res.data.data;
  },

  /**
   * Apply a moderation decision.
   * action: 'hide'    -> remove the comment from all public reads
   *         'dismiss' -> clear the report flags, leave it visible
   */
  async moderateComment(
    commentId: string,
    action: 'hide' | 'dismiss'
  ): Promise<{ comment: { _id: string; hidden: boolean; reported: boolean; reportCount: number } }> {
    const res = await api.patch(`/curator/comments/${commentId}/moderate`, { action });
    return res.data.data;
  },

  /**
   * Curate soundtrack moments for a title (iTunes-enriched automatically).
   */
  async addCuratedSoundtrack(payload: {
    titleName?: string;
    tmdbId?: number;
    mediaType?: string;
    tracks?: { songName: string; artist: string; episodeRef?: string }[];
  }) {
    const res = await api.post('/curator/soundtracks', payload);
    return res.data.data;
  },

  /**
   * Batch-correct episode titles / synopses / stills.
   */
  async updateCuratedEpisodes(payload: {
    titleName?: string;
    tmdbId?: number;
    seasonNumber: number;
    episodes: { episodeNumber: number; summary?: string; name?: string; stillUrl?: string }[];
  }) {
    const res = await api.post('/curator/episodes', payload);
    return res.data.data;
  },
};