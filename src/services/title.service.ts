import { api } from './api';
import { cachedGet, invalidateCache } from './requestCache';
import type { Title } from '../types';

export interface TitleFilterParams {
  genre?: string;
  type?: 'film' | 'tv';
  service?: string;
  mood?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TitleListResponse {
  titles: Title[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TrendingFeed {
  titles: Title[];
  /** Where the list came from, so the UI can label it honestly. */
  source: 'tmdb' | 'catalogue';
}

export const titleService = {
  /**
   * Fetch catalogue titles with multi-dimensional filtering
   */
  async getTitles(params?: TitleFilterParams): Promise<TitleListResponse> {
    const res = await cachedGet('/titles', { params }, { ttlMs: 5 * 60_000, persist: true });
    return res.data.data;
  },

  /**
   * Fetch trending titles plus their provenance.
   */
  async getTrendingFeed(mediaType: 'all' | 'movie' | 'tv' = 'all'): Promise<TrendingFeed> {
    const res = await cachedGet('/titles/trending', { params: { mediaType } }, { ttlMs: 5 * 60_000, persist: true });
    return {
      titles: res.data.data.titles || [],
      source: res.data.data.source === 'tmdb' ? 'tmdb' : 'catalogue',
    };
  },

  /**
   * Fetch trending titles (titles only).
   */
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all'): Promise<Title[]> {
    const { titles } = await this.getTrendingFeed(mediaType);
    return titles;
  },

  /**
   * Fetch all available genres
   */
  async getGenres(): Promise<string[]> {
    const res = await cachedGet('/titles/genres', undefined, { ttlMs: 30 * 60_000, persist: true });
    return res.data.data.genres;
  },

  /**
   * Search titles by text
   */
  async search(q: string, type?: 'film' | 'tv'): Promise<Title[]> {
    const res = await cachedGet('/titles/search', { params: { q, type } }, { ttlMs: 2 * 60_000, persist: true });
    return res.data.data.titles;
  },

  /**
   * Get full title details by ID or TMDB ID
   */
  async getTitleDetails(idOrTmdbId: string | number, type?: 'film' | 'tv'): Promise<Title> {
    const res = await cachedGet(`/titles/${idOrTmdbId}`, {
      params: type ? { type } : undefined,
    }, { ttlMs: 10 * 60_000, persist: true });
    return res.data.data.title;
  },

  /**
   * Fetch rich episodes for a specific season
   */
  async getSeasonEpisodes(idOrTmdbId: string | number, seasonNumber: number) {
    const res = await cachedGet(`/titles/${idOrTmdbId}/seasons/${seasonNumber}`, undefined, { ttlMs: 10 * 60_000, persist: true });
    return res.data.data.season;
  },

  /**
   * Add a discussion comment or reply to a title (with optional rating or poll)
   */
  async addComment(
    titleId: string,
    text: string,
    rating?: number,
    containsSpoilers = false,
    parentId?: string | null,
    poll?: { question: string; options: string[] }
  ) {
    const res = await api.post(`/titles/${titleId}/comments`, {
      text,
      rating,
      containsSpoilers,
      parentId,
      poll,
    });
    invalidateCache([`/titles/${titleId}/comments`]);
    return res.data.data.comment;
  },

  /**
   * Toggle like on a discussion comment (like/unlike)
   */
  async toggleLike(commentId: string) {
    const res = await api.post(`/titles/comments/${commentId}/like`);
    invalidateCache(['/titles/']);
    return res.data.data; // { commentId, isLiked, likesCount }
  },

  /**
   * Toggle like on a title (like/unlike)
   */
  async toggleLikeTitle(titleId: string) {
    const res = await api.post(`/titles/${titleId}/like`);
    invalidateCache(['/titles/']);
    return res.data.data; // { titleId, isLiked, likesCount }
  },

  /**
   * Get users who liked a comment
   */
  async getCommentLikers(commentId: string, page = 1, limit = 20) {
    const res = await api.get(`/titles/comments/${commentId}/likers`, { params: { page, limit } });
    return res.data.data; // { likers, total, page, limit, hasMore }
  },

  /**
   * React to a discussion comment with emoji (Facebook-style)
   */
  async reactToComment(commentId: string, emoji: string) {
    const res = await api.post(`/titles/comments/${commentId}/react`, { emoji });
    invalidateCache(['/titles/']);
    return res.data.data.comment;
  },

  /**
   * Vote on a comment poll
   */
  async voteCommentPoll(commentId: string, optionIndex: number) {
    const res = await api.post(`/titles/comments/${commentId}/poll/vote`, { optionIndex });
    invalidateCache(['/titles/']);
    return res.data.data.comment;
  },

  /**
   * Soft delete a comment (author only).
   */
  async deleteComment(commentId: string) {
    const res = await api.delete(`/titles/comments/${commentId}`);
    return res.data.data;
  },

  /**
   * Report a comment for curator moderation
   */
  async reportComment(commentId: string, reason?: string) {
    const res = await api.post(`/titles/comments/${commentId}/report`, {
      reason: reason?.trim() || undefined,
    });
    invalidateCache(['/titles/']);
    return res.data.data;
  },

  /**
   * Get comments for a title
   */
  async getComments(titleId: string) {
    const res = await cachedGet(`/titles/${titleId}/comments`, undefined, { ttlMs: 30_000, staleWhileRevalidateMs: 60_000 });
    return res.data.data.comments;
  },

  /**
   * Trigger catalogue seed
   */
  async seedCatalogue(force = false) {
    const res = await api.post('/titles/seed', null, { params: { force } });
    return res.data.data;
  },

  /**
 * Search Apple Music for soundtrack suggestions.
   * `titleName` gives the backend context so it can rank the version that
   * actually belongs to the film/series being viewed to the top.
   */
  async searchMusic(query: string, titleName?: string) {
    const res = await cachedGet('/titles/music/search', {
      params: { q: query, ...(titleName ? { titleName } : {}) },
    }, { ttlMs: 5 * 60_000, persist: true });
    return res.data.data.tracks;
  },

  /**
   * Add a song to a title's soundtrack catalog
   */
  async addSoundtrack(
    titleId: string,
    payload: {
      songName: string;
      artist: string;
      episodeRef?: string;
      previewUrl?: string;
      albumArtUrl?: string;
      appleMusicUrl?: string;
      spotifyUrl?: string;
    }
  ) {
    const res = await api.post(`/titles/${titleId}/soundtracks`, payload);
    return res.data.data.soundtrack;
  },
};
