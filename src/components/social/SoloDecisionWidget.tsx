import React, { useState } from 'react';
import { Sparkles, Clock, Compass, ArrowRight, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOODS = [
  { label: 'Comfort', emoji: '🛋️' },
  { label: 'Gripping', emoji: '⚡' },
  { label: 'Mind-Bending', emoji: '🧠' },
  { label: 'Fun', emoji: '🍿' },
  { label: 'Stunning', emoji: '✨' },
];

const DURATIONS = [
  { label: '30m', value: 30 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
  { label: '120m+', value: 120 },
];

const AI_VIBE_INSPIRATIONS = [
  'Rainy neo-noir mystery under 100m 🌧️',
  'Like Knives Out with eccentric laughs 🔍',
  'Mind-bending space thriller without gore 🚀',
  'Cozy nostalgic 90s comfort movie 📼',
];

export const SoloDecisionWidget: React.FC = () => {
  const [mode, setMode] = useState<'quick' | 'ai'>('quick');
  const [selectedDuration, setSelectedDuration] = useState<number>(90);
  const [selectedMood, setSelectedMood] = useState<string>('Gripping');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const navigate = useNavigate();

  const handleLaunch = () => {
    navigate('/recommend', {
      state: mode === 'ai' ? { aiPrompt } : { selectedDuration, selectedMood },
    });
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl shadow-indigo-950/20 backdrop-blur-sm">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">Need something to watch right now?</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Context decision or natural vibe prompt</p>
          </div>
        </div>

        {/* Mode Pill Toggle */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-[10px] sm:text-xs font-semibold shrink-0">
          <button
            onClick={() => setMode('quick')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mode === 'quick'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Sliders
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mode === 'ai'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3 h-3 text-cyan-300" />
            <span>AI Match</span>
          </button>
        </div>
      </div>

      {mode === 'quick' ? (
        /* Quick Context Inputs */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-0.5">
          {/* Available Time */}
          <div className="space-y-1.5">
            <label className="text-[11px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-indigo-400" /> Available Time
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DURATIONS.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setSelectedDuration(dur.value)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all text-center active:scale-95 ${
                    selectedDuration === dur.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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
            <label className="text-[11px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3 h-3 text-violet-400" /> Desired Mood
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  className={`py-1 px-2 rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1 active:scale-95 ${
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
      ) : (
        /* Natural-language vibe prompt */
        <div className="space-y-2.5 pt-0.5 animate-in fade-in duration-200">
          <div className="relative">
            <textarea
              rows={2}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe your exact vibe... (e.g. 'A gripping neo-noir like Blade Runner with rainy city vibes, under 110 minutes on Netflix')"
              className="w-full p-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Quick inspiration chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] text-slate-500 shrink-0">Try:</span>
            {AI_VIBE_INSPIRATIONS.map((chip) => (
              <button
                key={chip}
                onClick={() => setAiPrompt(chip)}
                className="px-2 py-0.5 rounded-full text-[10px] bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 shrink-0 hover:border-slate-700 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
        <span className="text-[11px] text-slate-400 text-center sm:text-left">
          {mode === 'quick' ? (
            <>
              Selected: <strong className="text-indigo-300">{selectedDuration} mins</strong> • <strong className="text-violet-300">{selectedMood}</strong>
            </>
          ) : (
            <span className="text-violet-300 font-medium flex items-center gap-1 justify-center sm:justify-start">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Tell us the vibe — we&apos;ll find the match
            </span>
          )}
        </span>
        <button
          onClick={handleLaunch}
          className="w-full sm:w-auto py-2 sm:py-1.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] group"
        >
          {mode === 'ai' ? 'Analyze Vibe & Match' : 'Compute Shortlist'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
