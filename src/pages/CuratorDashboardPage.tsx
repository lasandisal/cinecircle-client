import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Music,
  AlertTriangle,
  Loader2,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Play,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  curatorService,
  type FlaggedComment,
} from '../services/curator.service';

type QueueTab = 'open' | 'resolved';

const relativeTime = (iso?: string): string => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const CuratorDashboardPage: React.FC = () => {
  // --- Moderation queue ---
  const [tab, setTab] = useState<QueueTab>('open');
  const [comments, setComments] = useState<FlaggedComment[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // --- Soundtrack curation ---
  const [showSoundtrackForm, setShowSoundtrackForm] = useState(false);
  const [stTitleName, setStTitleName] = useState('');
  const [stSongName, setStSongName] = useState('');
  const [stArtist, setStArtist] = useState('');
  const [stEpisodeRef, setStEpisodeRef] = useState('');
  const [stSubmitting, setStSubmitting] = useState(false);
  const [stResult, setStResult] = useState<string | null>(null);
  const [stError, setStError] = useState<string | null>(null);

  const loadQueue = useCallback(async (which: QueueTab) => {
    setLoadingQueue(true);
    setQueueError(null);
    try {
      const data = await curatorService.getFlaggedComments(which);
      setComments(data.reportedComments || []);
      if (typeof data.openCount === 'number') setOpenCount(data.openCount);
    } catch (err: any) {
      setQueueError(
        err?.response?.data?.error || 'Could not load the moderation queue.'
      );
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadQueue(tab);
  }, [tab, loadQueue]);

  const moderate = async (commentId: string, action: 'hide' | 'dismiss') => {
    if (actingOn) return;
    setActingOn(commentId);
    setQueueError(null);
    try {
      await curatorService.moderateComment(commentId, action);
      // Drop it from the current view immediately.
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      if (action === 'hide') {
        setOpenCount((n) => Math.max(0, n - 1));
      }
    } catch (err: any) {
      setQueueError(err?.response?.data?.error || 'Moderation action failed.');
    } finally {
      setActingOn(null);
    }
  };

  const submitSoundtrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stSubmitting) return;
    if (!stTitleName.trim() || !stSongName.trim() || !stArtist.trim()) return;

    setStSubmitting(true);
    setStError(null);
    setStResult(null);
    try {
      const data = await curatorService.addCuratedSoundtrack({
        titleName: stTitleName.trim(),
        tracks: [
          {
            songName: stSongName.trim(),
            artist: stArtist.trim(),
            episodeRef: stEpisodeRef.trim() || undefined,
          },
        ],
      });
      setStResult(
        `Curated "${data.titleName}" — ${data.count} track(s) saved and enriched with Apple previews.`
      );
      setStSongName('');
      setStArtist('');
      setStEpisodeRef('');
    } catch (err: any) {
      setStError(err?.response?.data?.error || 'Could not save that soundtrack entry.');
    } finally {
      setStSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              Curator &amp; Admin Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Role-Based Access Control (Admin / Curator)
            </p>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Moderation Queue
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comments reported by community members, awaiting review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-950/70 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setTab('open')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  tab === 'open'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Open ({openCount})
              </button>
              <button
                type="button"
                onClick={() => setTab('resolved')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  tab === 'resolved'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Resolved
              </button>
            </div>
            <button
              type="button"
              onClick={() => loadQueue(tab)}
              className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {queueError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {queueError}
          </div>
        )}

        {loadingQueue ? (
          <div className="flex items-center justify-center py-10 gap-2 text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading reported comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">
              {tab === 'open' ? 'Queue is clear' : 'Nothing resolved yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {tab === 'open'
                ? 'No community comments are currently awaiting moderation.'
                : 'Previously hidden or dismissed comments will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const isOpen = expandedId === c._id;
              return (
                <div
                  key={c._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : c._id)}
                    className="w-full p-4 flex items-start gap-3 text-left cursor-pointer hover:bg-slate-900/40 transition-colors"
                  >
                    {c.title?.posterUrl ? (
                      <img
                        src={c.title.posterUrl}
                        alt={c.title.name}
                        className="w-9 h-13 object-cover rounded-md border border-slate-800 shrink-0"
                        style={{ height: 52 }}
                      />
                    ) : (
                      <div className="w-9 rounded-md bg-slate-900 border border-slate-800 shrink-0" style={{ height: 52 }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {c.user?.name || 'Unknown member'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          on{' '}
                          <span className="text-indigo-300 font-semibold">
                            {c.title?.name || 'unknown title'}
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{c.text}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[9px] font-bold border border-rose-500/30">
                          {c.reportCount} report{c.reportCount === 1 ? '' : 's'}
                        </span>
                        {c.hidden && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[9px] font-bold border border-slate-700">
                            Hidden
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {relativeTime(c.reportedAt || c.createdAt)}
                        </span>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/70 space-y-3 animate-in fade-in duration-150">
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                        {c.text}
                      </p>

                      {(c.reports?.length || 0) > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Reports received
                          </p>
                          <div className="space-y-1">
                            {c.reports!.map((r, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-slate-400 flex items-start gap-2"
                              >
                                <span className="text-slate-500 shrink-0">
                                  {r.user?.name || 'member'}
                                </span>
                                <span className="text-slate-300">
                                  {r.reason ? `"${r.reason}"` : 'no reason given'}
                                </span>
                                <span className="text-slate-600 shrink-0 ml-auto">
                                  {relativeTime(r.createdAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => moderate(c._id, 'dismiss')}
                          disabled={actingOn === c._id}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Dismiss report
                        </button>
                        <button
                          type="button"
                          onClick={() => moderate(c._id, 'hide')}
                          disabled={actingOn === c._id}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {actingOn === c._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          Hide comment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Soundtrack curation */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-400" /> Curated Soundtracks
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add an iconic needle-drop. Audio previews and cover art are fetched
              from Apple automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSoundtrackForm((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {showSoundtrackForm ? 'Close' : 'Add track'}
          </button>
        </div>

        {showSoundtrackForm && (
          <form onSubmit={submitSoundtrack} className="space-y-3 pt-1 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Title name (as in the catalogue)
                </span>
                <input
                  type="text"
                  value={stTitleName}
                  onChange={(e) => setStTitleName(e.target.value)}
                  placeholder="e.g. Stranger Things"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Scene / episode context
                </span>
                <input
                  type="text"
                  value={stEpisodeRef}
                  onChange={(e) => setStEpisodeRef(e.target.value)}
                  placeholder="e.g. Season 4 - Max's Mind Lair Escape"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Song name
                </span>
                <input
                  type="text"
                  value={stSongName}
                  onChange={(e) => setStSongName(e.target.value)}
                  placeholder="e.g. Running Up That Hill"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Artist
                </span>
                <input
                  type="text"
                  value={stArtist}
                  onChange={(e) => setStArtist(e.target.value)}
                  placeholder="e.g. Kate Bush"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </label>
            </div>

            {stError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {stError}
              </div>
            )}
            {stResult && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {stResult}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  stSubmitting ||
                  !stTitleName.trim() ||
                  !stSongName.trim() ||
                  !stArtist.trim()
                }
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {stSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Curate track
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};