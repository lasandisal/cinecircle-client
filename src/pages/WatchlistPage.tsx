import React from 'react';
import { Bookmark } from 'lucide-react';

export const WatchlistPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-amber-400" />
            My Watchlist
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Keep track of titles to watch, record 1-5 star ratings, and train your personal taste profile.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center py-16 text-slate-500 text-sm">
        Watchlist items will appear here (Skeleton view).
      </div>
    </div>
  );
};
