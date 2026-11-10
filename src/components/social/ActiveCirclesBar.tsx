import React, { useEffect, useState } from 'react';
import { Plus, Users, Flame, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { socialService, type ActiveCircleItem } from '../../services/social.service';

export const ActiveCirclesBar: React.FC = () => {
  const [circles, setCircles] = useState<ActiveCircleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const { display } = await socialService.getActiveSessions();
        setCircles(display);
      } catch (err) {
        console.error('Failed to load active circles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCircles();
  }, []);

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <h2 className="text-[11px] sm:text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Active Watch Circles
          </h2>
        </div>
        <Link to="/group?view=all" className="text-[11px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
          See All &rarr;
        </Link>
      </div>

      {/* Touch-optimized horizontal stories carousel */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth -mx-1 px-1">
        {/* Create Circle Tile */}
        <Link
          to="/group"
          className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-indigo-500/50 active:border-indigo-400 flex items-center justify-center bg-indigo-500/10 group-hover:bg-indigo-500/20 active:scale-95 transition-all">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 group-hover:text-white">
            New Circle
          </span>
        </Link>

        {loading ? (
          <div className="flex items-center gap-2 px-3 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            Loading circles...
          </div>
        ) : circles.map((circle) => (
          <Link
            key={circle.id}
            to={`/group?code=${circle.joinCode}`}
            className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none max-w-[64px] sm:max-w-[72px]"
          >
            <div className="relative">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-[2px] transition-transform duration-200 group-hover:scale-105 active:scale-95 ${
                  circle.isLive
                    ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800'
                }`}
              >
                <img
                  src={circle.hostAvatar}
                  alt={circle.hostName}
                  className="w-full h-full rounded-[14px] object-cover"
                />
              </div>

              {circle.isLive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-[0.5px] bg-red-600 text-[8px] font-extrabold text-white rounded-full uppercase tracking-wider shadow">
                  LIVE
                </span>
              )}
            </div>

            <div className="text-center w-full">
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-200 truncate group-hover:text-indigo-300">
                {circle.name}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                <Users className="w-2.5 h-2.5" /> {circle.participantsCount}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
