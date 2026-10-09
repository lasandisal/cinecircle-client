import React, { useState } from 'react';
import { Sparkles, Clock, Compass, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOODS = [
  { label: 'Comfort Rewatch', emoji: '🛋️' },
  { label: 'Gripping / Tense', emoji: '⚡' },
  { label: 'Mind-Bending', emoji: '🧠' },
  { label: 'Lighthearted / Fun', emoji: '🍿' },
  { label: 'Visually Stunning', emoji: '✨' },
];

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120+ min', value: 120 },
];

export const SoloDecisionWidget: React.FC = () => {
  const [selectedDuration, setSelectedDuration] = useState<number>(90);
  const [selectedMood, setSelectedMood] = useState<string>('Gripping / Tense');
  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate('/recommend');
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-5 space-y-4 shadow-xl shadow-indigo-950/30 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Need something to watch right now?</h3>
            <p className="text-xs text-slate-400">Answer 2 quick context prompts — we compute your match</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Available Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Available Time
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {DURATIONS.map((dur) => (
              <button
                key={dur.value}
                onClick={() => setSelectedDuration(dur.value)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  selectedDuration === dur.value
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desired Mood */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-violet-400" /> Current Mood
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((mood) => (
              <button
                key={mood.label}
                onClick={() => setSelectedMood(mood.label)}
                className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedMood === mood.label
                    ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
        <span className="text-[11px] text-slate-400">
          Selected: <strong className="text-indigo-300">{selectedDuration} mins</strong> • <strong className="text-violet-300">{selectedMood}</strong>
        </span>
        <button
          onClick={handleLaunch}
          className="py-1.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all group"
        >
          Compute Shortlist
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
