import React, { useState, useEffect } from 'react';
import { Bookmark, Star, Check, Trash2, Clock, Film, Tv, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { watchlistService, type WatchlistItem, type WatchlistCounts } from '../services/watchlist.service';

export const WatchlistPage: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'want_to_watch' | 'watched'>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * Unfiltered totals, supplied by the server.
   *
   * These were previously derived from `items`, which is already filtered by
   * the active pill - so picking "Watched" showed "Want to Watch (0)" and made
   * "All" display the filtered count rather than the real total.
   */
  const [counts, setCounts] = useState<WatchlistCounts>({ total: 0, watched: 0, wantToWatch: 0 });

  const fetchWatchlist = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { items: list, counts: totals } = await watchlistService.getWatchlist(
        filter === 'all' ? undefined : filter
      );
      setItems(list);
      setCounts(totals);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Keep the pill counts correct after ticking an item off, without waiting for
   * a refetch (which would also reset the active filter's contents).
   */
  const adjustCounts = (wasWatched: boolean, nowWatched: boolean) => {
    if (wasWatched === nowWatched) return;
    setCounts((c) => {
      const delta = nowWatched ? 1 : -1;
      return {
        watched: Math.max(0, c.watched + delta),
        wantToWatch: Math.max(0, c.wantToWatch - delta),
        total: c.total,
      };
    });
  };

  useEffect(() => {
    fetchWatchlist();
  }, [isAuthenticated, filter]);

  const handleToggleWatched = async (item: WatchlistItem) => {
    try {
      setActionLoading(item._id);
      const updated = await watchlistService.markAsWatched(item._id, !item.watched);
      adjustCounts(item.watched, updated.watched);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, watched: updated.watched, watchedAt: updated.watchedAt } : i))
      );
    } catch (err) {
      console.error('Failed to toggle watched:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRate = async (item: WatchlistItem, rating: number) => {
    try {
      setActionLoading(item._id);
      const updated = await watchlistService.rateTitle(item._id, rating);
      // Rating implies watched, so the counts can shift here too.
      adjustCounts(item.watched, true);
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, starRating: updated.starRating, watched: true } : i))
      );
    } catch (err) {
      console.error('Failed to rate title:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    try {
      setActionLoading(item._id);
      await watchlistService.removeFromWatchlist(item._id);
      setItems((prev) => prev.filter((i) => i._id !== item._id));
      setCounts((c) => {
        const watched = Math.max(0, c.watched - (item.watched ? 1 : 0));
        const wantToWatch = Math.max(0, c.wantToWatch - (item.watched ? 0 : 1));
        return { watched, wantToWatch, total: watched + wantToWatch };
      });
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto shadow-xl shadow-indigo-600/10">
          <Bookmark className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white font-['Outfit']">My Watchlist</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Save titles to watch later, log 1-5 star ratings, and train your personal taste matrix.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <p className="text-sm text-slate-300">
            Sign in with your email or OTP to unlock your cloud watchlist across all devices.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login', { state: { from: { pathname: '/watchlist' } } })}
              className="py-2.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register', { state: { from: { pathname: '/watchlist' } } })}
              className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition-all"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Totals come from the server and are NOT affected by the active filter.
  const watchedCount = counts.watched;
  const wantToWatchCount = counts.wantToWatch;
  const totalCount = counts.total;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-['Outfit'] flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-amber-400" />
            My List
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {totalCount} title{totalCount === 1 ? '' : 's'} saved •{' '}
            {wantToWatchCount} to watch • {watchedCount} watched
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilter('want_to_watch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'want_to_watch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Want to Watch ({wantToWatchCount})
          </button>
          <button
            onClick={() => setFilter('watched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'watched'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Watched ({watchedCount})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading your real watchlist...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            {/* Distinguish "your whole list is empty" from "this filter is empty",
                which are very different situations. */}
            <h3 className="text-base font-bold text-white">
              {filter === 'watched'
                ? "You haven't marked anything as watched yet"
                : filter === 'want_to_watch'
                  ? 'Nothing on your Want to Watch list'
                  : 'Your list is currently empty'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filter === 'watched'
                ? 'Tick an item as watched from the Want to Watch tab, or rate a title from its detail page, and it will move here.'
                : filter === 'want_to_watch'
                  ? 'Everything you have saved has been marked as watched. Switch to the Watched tab to see them.'
                  : 'Explore trending movies and series in our catalogue and click "+ Watchlist" to save them here.'}
            </p>
          </div>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              Show all {totalCount}
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            <span>Explore Trending Titles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const title = item.title;
            if (!title) return null;

            return (
              <div
                key={item._id}
                className="group relative bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 flex gap-4 transition-all duration-200 shadow-sm"
              >
                {/* Poster Thumbnail */}
                <Link
                  to={`/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`}
                  className="shrink-0 relative overflow-hidden rounded-xl w-24 h-36 bg-slate-950 border border-slate-800/80 shadow"
                >
                  <img
                    src={title.posterUrl}
                    alt={title.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white uppercase flex items-center gap-0.5">
                    {title.type === 'tv' ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                    <span>{title.type}</span>
                  </div>
                </Link>

                {/* Details & Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`}
                        className="text-base font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1"
                      >
                        {title.name}
                      </Link>
                      <button
                        onClick={() => handleRemove(item)}
                        disabled={actionLoading === item._id}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{title.releaseYear}</span>
                      {title.runtimeMinutes ? (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {title.runtimeMinutes}m
                          </span>
                        </>
                      ) : null}
                      {title.voteAverage ? (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" /> {title.voteAverage}
                          </span>
                        </>
                      ) : null}
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(title.genres || []).slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Watch Status & Rating Row */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    {/* Watched Toggle Button */}
                    <button
                      onClick={() => handleToggleWatched(item)}
                      disabled={actionLoading === item._id}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.watched
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${item.watched ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.watched ? 'Watched' : 'Mark Watched'}</span>
                    </button>

                    {/* 1-5 Star Personal Rating Selector */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(item, star)}
                          disabled={actionLoading === item._id}
                          className="p-0.5 hover:scale-125 transition-transform"
                          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              (item.starRating || 0) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600 hover:text-amber-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
