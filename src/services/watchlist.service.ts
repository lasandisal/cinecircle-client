import { api } from './api';
import type { Title } from '../types';

export interface WatchlistItem {
  _id: string;
  user: string;
  title: Title;
  watched: boolean;
  starRating?: number;
  addedAt: string;
  watchedAt?: string;
}

export const watchlistService = {
  /**
   * Get user's saved watchlist
   */
  async getWatchlist(status?: 'all' | 'watched' | 'want_to_watch'): Promise<WatchlistItem[]> {
    const res = await api.get('/watchlist', { params: { status } });
    return res.data.data.watchlist || [];
  },

  /**
   * Add title to watchlist
   */
  async addToWatchlist(titleId: string): Promise<WatchlistItem> {
    const res = await api.post('/watchlist', { titleId });
    return res.data.data.item;
  },

  /**
   * Remove item from watchlist
   */
  async removeFromWatchlist(idOrTitleId: string): Promise<void> {
    await api.delete(`/watchlist/${idOrTitleId}`);
  },

  /**
   * Toggle watched status
   */
  async markAsWatched(idOrTitleId: string, watched: boolean): Promise<WatchlistItem> {
    const res = await api.patch(`/watchlist/${idOrTitleId}/watched`, { watched });
    return res.data.data.item;
  },

  /**
   * Rate title (1-5 stars)
   */
  async rateTitle(idOrTitleId: string, rating: number): Promise<WatchlistItem> {
    const res = await api.patch(`/watchlist/${idOrTitleId}/rate`, { rating });
    return res.data.data.item;
  },
};
