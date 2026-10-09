import { api } from './api';
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

export const titleService = {
  /**
   * Fetch catalogue titles with multi-dimensional filtering
   */
  async getTitles(params?: TitleFilterParams): Promise<TitleListResponse> {
    const res = await api.get('/titles', { params });
    return res.data.data;
  },

  /**
   * Fetch trending titles
   */
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all'): Promise<Title[]> {
    const res = await api.get('/titles/trending', { params: { mediaType } });
    return res.data.data.titles;
  },

  /**
   * Fetch all available genres
   */
  async getGenres(): Promise<string[]> {
    const res = await api.get('/titles/genres');
    return res.data.data.genres;
  },

  /**
   * Search titles by text
   */
  async search(q: string, type?: 'film' | 'tv'): Promise<Title[]> {
    const res = await api.get('/titles/search', { params: { q, type } });
    return res.data.data.titles;
  },

  /**
   * Get full title details by ID or TMDB ID
   */
  async getTitleDetails(idOrTmdbId: string | number): Promise<Title> {
    const res = await api.get(`/titles/${idOrTmdbId}`);
    return res.data.data.title;
  },

  /**
   * Add a discussion comment to a title
   */
  async addComment(titleId: string, text: string, rating?: number, containsSpoilers = false) {
    const res = await api.post(`/titles/${titleId}/comments`, {
      text,
      rating,
      containsSpoilers,
    });
    return res.data.data.comment;
  },

  /**
   * Like a discussion comment
   */
  async likeComment(commentId: string) {
    const res = await api.post(`/titles/comments/${commentId}/like`);
    return res.data.data.comment;
  },

  /**
   * Get comments for a title
   */
  async getComments(titleId: string) {
    const res = await api.get(`/titles/${titleId}/comments`);
    return res.data.data.comments;
  },

  /**
   * Trigger catalogue seed
   */
  async seedCatalogue(force = false) {
    const res = await api.post('/titles/seed', null, { params: { force } });
    return res.data.data;
  },
};
