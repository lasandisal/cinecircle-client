import React, { useState } from 'react';
import { Film } from 'lucide-react';

interface TitlePosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Poster image with an honest fallback.
 *
 * A missing or dead URL (the catalogue previously stored truncated TMDB
 * paths) used to render the browser's broken-image icon with overflowing alt
 * text. We instead show a neutral film tile so layouts never break.
 */
export const TitlePoster: React.FC<TitlePosterProps> = ({
  src,
  alt,
  className = '',
  iconClassName = 'w-6 h-6',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — poster unavailable`}
        className={`${className} bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center text-slate-600`}
      >
        <Film className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
