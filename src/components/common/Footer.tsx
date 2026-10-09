import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-8 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} CineCircle. Rapid Application Development (RAD) ITS2020.</p>
        <div className="flex items-center gap-6">
          <span className="text-xs text-slate-400">Powered by TMDB & JustWatch</span>
          <span className="text-xs text-indigo-400">MERN + TypeScript</span>
        </div>
      </div>
    </footer>
  );
};
