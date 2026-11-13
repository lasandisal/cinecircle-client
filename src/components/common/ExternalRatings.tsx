import React from 'react';

interface ExternalRatingsProps {
  imdbRating?: number | null;
  rottenTomatoesRating?: number | null;
  size?: 'sm' | 'md';
}

export const ExternalRatings: React.FC<ExternalRatingsProps> = ({
  imdbRating,
  rottenTomatoesRating,
  size = 'md',
}) => {
  const hasImdb = typeof imdbRating === 'number' && imdbRating > 0;
  const hasRt = typeof rottenTomatoesRating === 'number' && rottenTomatoesRating >= 0;

  if (!hasImdb && !hasRt) return null;

  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-2.5 ${isSmall ? 'text-xs' : 'text-sm'}`}>
      {hasImdb && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-lg font-bold border border-amber-500/25 shadow-sm">
          <span className="bg-amber-500 text-slate-950 px-1 rounded text-[10px] font-black tracking-tight">
            IMDb
          </span>
          <span>★ {Number(imdbRating).toFixed(1)}</span>
        </div>
      )}

      {hasRt && (
        <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-300 px-2.5 py-0.5 rounded-lg font-bold border border-rose-500/25 shadow-sm">
          <span>{Number(rottenTomatoesRating) >= 60 ? '🍅' : '🟢'}</span>
          <span>{rottenTomatoesRating}%</span>
        </div>
      )}
    </div>
  );
};
