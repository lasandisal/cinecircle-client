import React, { useState } from 'react';
import { Sparkles, KeyRound, Flame, ArrowRight, UserPlus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const TASTE_MATCHES = [
  {
    name: 'Maya Chen',
    handle: '@mayacine',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
    matchScore: 94,
    mutualCount: 16,
  },
  {
    name: 'Julian Ross',
    handle: '@julianr',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces',
    matchScore: 89,
    mutualCount: 11,
  },
  {
    name: 'Chloe Bennett',
    handle: '@chloewatches',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces',
    matchScore: 86,
    mutualCount: 9,
  },
];

const TRENDING_DECISIONS = [
  { rank: 1, title: 'Dune: Part Two', votes: '142 rooms', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&h=160&fit=crop' },
  { rank: 2, title: 'Severance Season 2', votes: '98 rooms', poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&h=160&fit=crop' },
  { rank: 3, title: 'Challengers', votes: '77 rooms', poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=120&h=160&fit=crop' },
];

export const RightSocialSidebar: React.FC = () => {
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const toggleFollow = (handle: string) => {
    setFollowing((prev) => ({ ...prev, [handle]: !prev[handle] }));
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
            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-500"
          />
          <Link
            to="/group"
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
          >
            <span>Join</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Top Taste Matches */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Taste Matches For You
          </h4>
          <span className="text-[10px] text-slate-500">Recency Weighted</span>
        </div>

        <div className="space-y-3">
          {TASTE_MATCHES.map((user) => (
            <div key={user.handle} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-700"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">{user.name}</span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1 rounded">
                      {user.matchScore}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user.mutualCount} mutual titles watched
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(user.handle)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 ${
                  following[user.handle]
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
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

      {/* Trending Shortlists */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Popular in Decision Rooms
          </h4>
        </div>

        <div className="space-y-2.5">
          {TRENDING_DECISIONS.map((item) => (
            <Link
              key={item.title}
              to="/recommend"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
            >
              <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-400 w-4">
                #{item.rank}
              </span>
              <img
                src={item.poster}
                alt={item.title}
                className="w-8 h-11 object-cover rounded shadow"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-500">Shortlisted in {item.votes}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};
