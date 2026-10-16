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

export interface WatchlistCounts {
  total: number;
  watched: number;
  wantToWatch: number;
}

export const watchlistService = {
  /**
   * Get the user's list, optionally filtered.
   *
   * `counts` is always the UNFILTERED totals so the filter pills never show a
   * misleading number, while `items` respects the `status` filter.
   */
  async getWatchlist(
    status?: 'all' | 'watched' | 'want_to_watch'
  ): Promise<{ items: WatchlistItem[]; counts: WatchlistCounts }> {
    const res = await api.get('/watchlist', { params: { status } });
    return {
      items: res.data.data.watchlist || [],
      counts: res.data.data.counts || { total: 0, watched: 0, wantToWatch: 0 },
    };
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

  /**
   * Get title's watchlist, watched, and rating status for current user
   */
  async getTitleStatus(titleId: string): Promise<{ inWatchlist: boolean; watched: boolean; starRating: number }> {
    try {
      const res = await api.get(`/watchlist/status/${titleId}`);
      return res.data.data;
    } catch {
      return { inWatchlist: false, watched: false, starRating: 0 };
    }
  },
};
