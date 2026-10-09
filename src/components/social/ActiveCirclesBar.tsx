import React from 'react';
import { Plus, Users, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CircleStory {
  id: string;
  name: string;
  hostName: string;
  hostAvatar: string;
  participantsCount: number;
  genre: string;
  code: string;
  isLive: boolean;
}

const SAMPLE_CIRCLES: CircleStory[] = [
  {
    id: '1',
    name: 'Sci-Fi Friday',
    hostName: 'Marcus V.',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    participantsCount: 4,
    genre: 'Sci-Fi & Space',
    code: 'SCI890',
    isLive: true,
  },
  {
    id: '2',
    name: 'Comfort Rewatch',
    hostName: 'Sarah K.',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    participantsCount: 3,
    genre: 'Comedy / Chill',
    code: 'COM412',
    isLive: true,
  },
  {
    id: '3',
    name: 'Late Night Thriller',
    hostName: 'David R.',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    participantsCount: 5,
    genre: 'Psychological',
    code: 'THR771',
    isLive: true,
  },
  {
    id: '4',
    name: 'Anime & Cyberpunk',
    hostName: 'Elena P.',
    hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    participantsCount: 2,
    genre: 'Animation',
    code: 'ANI204',
    isLive: false,
  },
];

export const ActiveCirclesBar: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Active Watch Circles
          </h2>
        </div>
        <Link to="/group" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
          View all circles &rarr;
        </Link>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Create Circle Tile */}
        <Link
          to="/group"
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
        >
          <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 flex items-center justify-center bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-all">
            <Plus className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">
            New Circle
          </span>
        </Link>

        {/* Live Circles */}
        {SAMPLE_CIRCLES.map((circle) => (
          <Link
            key={circle.id}
            to="/group"
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none max-w-[72px]"
          >
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-2xl p-[2px] transition-transform duration-200 group-hover:scale-105 ${
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
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-[1px] bg-red-600 text-[9px] font-extrabold text-white rounded-full uppercase tracking-wider shadow">
                  LIVE
                </span>
              )}
            </div>

            <div className="text-center w-full">
              <p className="text-[11px] font-semibold text-slate-200 truncate group-hover:text-indigo-300">
                {circle.name}
              </p>
              <p className="text-[10px] text-slate-500 flex items-center justify-center gap-0.5">
                <Users className="w-2.5 h-2.5" /> {circle.participantsCount}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
