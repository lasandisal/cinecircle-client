import React from 'react';
import { Film } from 'lucide-react';

export const TitleDetailPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-indigo-400 text-sm font-semibold uppercase tracking-wider">
          <Film className="w-4 h-4" /> Enthusiast Detail Layer
        </div>
        <h1 className="text-3xl font-bold text-white font-['Outfit']">
          Title Details & Discussion (Skeleton)
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Displays synopsis, season & episode breakdowns, full cast credits, JustWatch streaming availability,
          curated soundtracks, and community discussions.
        </p>
      </div>
    </div>
  );
};
