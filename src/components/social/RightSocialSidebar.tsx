import React, { useState, useEffect } from 'react';
import { KeyRound, Flame, ArrowRight, UserPlus, Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { titleService } from '../../services/title.service';
import type { Title } from '../../types';

import { socialService, type UserSuggestion } from '../../services/social.service';
import { userService } from '../../services/user.service';

export const RightSocialSidebar: React.FC = () => {
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [trendingTitles, setTrendingTitles] = useState<Title[]>([]);
  const [tasteMatches, setTasteMatches] = useState<UserSuggestion[]>([]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const [titles, users] = await Promise.all([
          titleService.getTrending(),
          socialService.getUserSuggestions(),
        ]);
        setTrendingTitles(titles.slice(0, 5));
        setTasteMatches(users.slice(0, 4));
      } catch (err) {
        console.error('Failed to load sidebar data:', err);
      }
    };
    fetchSidebarData();
  }, []);

  const toggleFollow = async (userId: string, handle: string) => {
    try {
      const res = await userService.toggleFollow(userId);
      setFollowing((prev) => ({ ...prev, [handle]: res.following }));
    } catch {
      setFollowing((prev) => ({ ...prev, [handle]: !prev[handle] }));
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

      {/* Taste Match Suggestions */}
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
          {tasteMatches.map((user) => (
            <div key={user.handle} className="flex items-center justify-between gap-3">
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
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                      {user.matchScore}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user.mutualCount} mutual films
                  </p>
                </div>
              </Link>

              <button
                onClick={() => toggleFollow(user.id, user.handle)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  following[user.handle]
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {following[user.handle] ? (
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
          ))}
        </div>
      </div>

      {/* Trending Catalogue Titles from MongoDB */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Trending in Catalogue
          </h4>
        </div>

        <div className="space-y-2.5">
          {trendingTitles.length > 0 ? (
            trendingTitles.map((title, idx) => (
              <Link
                key={title._id || title.tmdbId}
                to={`/title/${title._id || title.tmdbId}${title.type ? `?type=${title.type}` : ''}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-400 w-4">
                  #{idx + 1}
                </span>
                <img
                  src={title.posterUrl}
                  alt={title.name}
                  className="w-8 h-11 object-cover rounded shadow"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                    {title.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{title.releaseYear}</span>
                    {title.voteAverage ? (
                      <span className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        {title.voteAverage}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-2">Loading trending titles...</p>
          )}
        </div>
      </div>
    </aside>
  );
};
