import React from 'react';

export type StreamingServiceName =
  | 'Netflix'
  | 'Prime Video'
  | 'Prime'
  | 'Disney+'
  | 'Apple TV+'
  | 'Max'
  | 'Hulu'
  | string;

interface StreamingBadgeProps {
  service: StreamingServiceName;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StreamingBadge: React.FC<StreamingBadgeProps> = ({
  service,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  const norm = service.toLowerCase().trim();

  // Size styling
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-1 gap-1.5',
    md: 'text-xs px-2.5 py-1.5 gap-2',
    lg: 'text-sm px-3 py-2 gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (norm.includes('netflix')) {
    return (
      <span
        title="Netflix"
        className={`inline-flex items-center rounded-lg font-semibold bg-[#141414] hover:bg-[#1f1f1f] text-white border border-[#E50914]/40 shadow-sm transition-all duration-200 ${sizeClasses[size]} ${className}`}
      >
        {/* Netflix N Ribbon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizes[size]} shrink-0`}
        >
          <path
            d="M5 2H9.5L14.5 17.5V2H19V22H14.5L9.5 6.5V22H5V2Z"
            fill="#E50914"
          />
          <path
            d="M9.5 6.5L14.5 17.5H19V22H14.5L9.5 6.5Z"
            fill="#B81D24"
          />
        </svg>
        {showLabel && <span className="font-bold tracking-tight text-slate-100">Netflix</span>}
      </span>
    );
  }

  if (norm.includes('prime')) {
    return (
      <span
        title="Amazon Prime Video"
        className={`inline-flex items-center rounded-lg font-semibold bg-[#00050d] hover:bg-[#081224] text-white border border-[#00A8E1]/40 shadow-sm transition-all duration-200 ${sizeClasses[size]} ${className}`}
      >
        {/* Prime Video Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizes[size]} shrink-0`}
        >
          <rect width="24" height="24" rx="4" fill="#00050d" />
          <path
            d="M3 13.5C7.5 16.5 14 16.5 18.5 13"
            stroke="#00A8E1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M17 11.5L19.5 13L18 15.5"
            stroke="#00A8E1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 7H9C10.5 7 11.5 8 11.5 9.5C11.5 11 10.5 12 9 12H6V7Z"
            fill="#FFFFFF"
          />
        </svg>
        {showLabel && <span className="font-bold tracking-tight text-[#00A8E1]">Prime Video</span>}
      </span>
    );
  }

  if (norm.includes('disney')) {
    return (
      <span
        title="Disney+"
        className={`inline-flex items-center rounded-lg font-semibold bg-[#040714] hover:bg-[#0b102b] text-white border border-[#00D6FE]/40 shadow-sm transition-all duration-200 ${sizeClasses[size]} ${className}`}
      >
        {/* Disney+ Arch & Star */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizes[size]} shrink-0`}
        >
          <path
            d="M3 14C3 8.5 8 4 14.5 4C17.5 4 20 5 21 6"
            stroke="#00D6FE"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 9V17M12 13H20"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="13" r="3" fill="#00D6FE" />
        </svg>
        {showLabel && <span className="font-bold tracking-tight text-cyan-300">Disney+</span>}
      </span>
    );
  }

  if (norm.includes('apple')) {
    return (
      <span
        title="Apple TV+"
        className={`inline-flex items-center rounded-lg font-semibold bg-[#111317] hover:bg-[#1a1d24] text-white border border-slate-700 shadow-sm transition-all duration-200 ${sizeClasses[size]} ${className}`}
      >
        {/* Apple Logo */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizes[size]} shrink-0 text-white`}
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96 1.01-3.1-.97.04-2.15.65-2.85 1.47-.61.71-1.15 1.87-1.01 2.98 1.09.09 2.18-.54 2.85-1.35z" />
        </svg>
        {showLabel && <span className="font-bold tracking-tight text-slate-100">Apple TV+</span>}
      </span>
    );
  }

  if (norm.includes('max') || norm.includes('hbo')) {
    return (
      <span
        title="Max"
        className={`inline-flex items-center rounded-lg font-semibold bg-[#0b0c26] hover:bg-[#141645] text-white border border-[#4922ff]/50 shadow-sm transition-all duration-200 ${sizeClasses[size]} ${className}`}
      >
        <span className="font-black italic tracking-tighter text-[#5c3bff]">MAX</span>
        {showLabel && <span className="font-bold tracking-tight text-indigo-200">Max</span>}
      </span>
    );
  }

  if (norm.includes('hulu')) {
    return (
      <span
        title="Hulu"
        className={`inline-flex items-center rounded-lg font-semibold bg-[#0c1a11] hover:bg-[#12281a] text-white border border-[#1CE783]/40 shadow-sm transition-all duration-200 ${sizeClasses[size]} ${className}`}
      >
        <span className="font-black tracking-tight text-[#1CE783]">hulu</span>
        {showLabel && <span className="font-bold tracking-tight text-emerald-300">Hulu</span>}
      </span>
    );
  }

  // Fallback for others
  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold bg-slate-900 text-slate-300 border border-slate-800 ${sizeClasses[size]} ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
      {service}
    </span>
  );
};
