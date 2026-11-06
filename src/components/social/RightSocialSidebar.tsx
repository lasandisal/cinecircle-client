import React, { useState, useEffect } from 'react';
import { KeyRound, Flame, ArrowRight, UserPlus, Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { titleService } from '../../services/title.service';
import type { Title } from '../../types';
import { TitlePoster } from '../common/TitlePoster';
import { useAppSelector } from '../../hooks/useAppRedux';

import { socialService, type UserSuggestion } from '../../services/social.service';
import { userService } from '../../services/user.service';

export const RightSocialSidebar: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [pendingFollow, setPendingFollow] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [trendingTitles, setTrendingTitles] = useState<Title[]>([]);
  const [trendingSource, setTrendingSource] = useState<'tmdb' | 'catalogue'>('catalogue');
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [tasteMatches, setTasteMatches] = useState<UserSuggestion[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchSidebarData = async () => {
      // Fetch independently: a failure in one panel must not blank the other.
      const [titlesResult, usersResult] = await Promise.allSettled([
        titleService.getTrendingFeed(),
        isAuthenticated ? socialService.getUserSuggestions() : Promise.resolve([]),
      ]);

      if (cancelled) return;

      if (titlesResult.status === 'fulfilled') {
        setTrendingTitles(titlesResult.value.titles.slice(0, 5));
        setTrendingSource(titlesResult.value.source);
      } else {
        console.error('Failed to load trending titles:', titlesResult.reason);
      }

      if (usersResult.status === 'fulfilled') {
        setTasteMatches(usersResult.value.slice(0, 4));
      } else {
        console.error('Failed to load taste matches:', usersResult.reason);
      }

      setTrendingLoading(false);
    };

    fetchSidebarData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Keyed by user id, not handle. Handles are optional and derived from the
  // email, so two members could collide on the same key.
  const toggleFollow = async (userId: string) => {
    if (pendingFollow) return;
    setPendingFollow(userId);
    try {
      const res = await userService.toggleFollow(userId);
      setFollowing((prev) => ({ ...prev, [userId]: res.following }));
    } catch (err) {
      // Do not optimistically flip the button on failure - a failed request
      // previously turned the button green as if the follow had succeeded.
      console.error('Failed to update follow:', err);
    } finally {
      setPendingFollow(null);
    }
  };

  return (
    <aside className="w-80 shrink-0 space-y-6 hidden xl:block">
      {/* Quick Join Room Card */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/50 to-slate-900/40 border border-indigo-500/25 rounded-2xl p-4 space-y-3 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Join a Circle</h4>
            <p className="text-[11px] text-slate-400">Enter a 6-character room code</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. SCI890"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
            maxLength={6}
            className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 uppercase tracking-widest font-mono focus:outline-none focus:border-indigo-500"
          />
          <Link
            to={`/group?code=${joinCodeInput}`}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
          >
            <span>Enter</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Taste Match Suggestions - members only, because compatibility needs
          the viewer's own ratings to compare against. */}
      {isAuthenticated ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Similar Taste Profiles
            </h4>
            <Link to="/profile" className="text-[10px] text-indigo-400 font-semibold hover:underline">
              View Profile
            </Link>
          </div>

          <div className="space-y-3">
            {tasteMatches.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Rate a few titles to see members with similar taste.
              </p>
            ) : (
              tasteMatches.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <Link to={`/profile/${user.id}`} className="flex items-center gap-2.5 min-w-0 group">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-800 group-hover:ring-indigo-500 transition-all"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                          {user.name}
                        </p>
                        {/* Real compatibility, or an honest no-data state.
                            Previously this was 84 + ((idx * 5) % 15). */}
                        {user.matchScore != null ? (
                          <span
                            className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20"
                            title={user.matchExplanation}
                          >
                            {user.matchScore}% match
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-bold text-slate-500 bg-slate-800/60 px-1 py-0.2 rounded border border-slate-700"
                            title={user.matchExplanation}
                          >
                            no data
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {user.mutualCount > 0
                          ? `${user.mutualCount} mutual film${user.mutualCount === 1 ? '' : 's'}`
                          : 'no shared titles yet'}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => toggleFollow(user.id)}
                    disabled={pendingFollow === user.id}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50 ${
                      following[user.id]
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {following[user.id] ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Followed</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Guests: informational only — Navbar is the single sign-in entry point */
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Find Your People
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sign in to discover members with similar taste, follow them, and compare what you both watched.
          </p>
        </div>
      )}

      {/* Trending catalogue titles */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {trendingSource === 'tmdb' ? 'Trending This Week' : 'Top Rated in Catalogue'}
          </h4>
        </div>

        <div className="space-y-2.5">
          {trendingLoading ? (
            <p className="text-xs text-slate-500 py-2">Loading trending titles...</p>
          ) : trendingTitles.length > 0 ? (
            trendingTitles.map((title, idx) => (
              <Link
                key={title._id || title.tmdbId}
                to={`/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-400 w-4">
                  #{idx + 1}
                </span>
                <TitlePoster
                  src={title.posterUrl}
                  alt={title.name}
                  className="w-8 h-11 shrink-0 object-cover rounded shadow"
                  iconClassName="w-4 h-4"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                    {title.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{title.releaseYear}</span>
                    {(title.voteAverage ?? 0) > 0 ? (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {(title.voteAverage ?? 0).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-2">Trending titles are unavailable right now.</p>
          )}
        </div>
      </div>
    </aside>
  );
};
