import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-bold text-white">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};
