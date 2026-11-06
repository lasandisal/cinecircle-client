import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  KeyRound,
  Sparkles,
  Trophy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ArrowRight,
  Loader2,
  Plus,
  Clock,
  Compass,
  Search,
  X,
  Film,
  Star,
  Crown,
} from 'lucide-react';
import { useAppSelector } from '../store';
import { sessionService, type GroupSessionDetail } from '../services/session.service';
import { socketService } from '../services/socket';
import { titleService } from '../services/title.service';
import type { Title } from '../types';

export const GroupSessionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [activeSession, setActiveSession] = useState<GroupSessionDetail | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create room state
  const [newRoomName, setNewRoomName] = useState('Friday Movie Night');
  const [newMood, setNewMood] = useState('Mind-Bending');
  const [newMaxRuntime, setNewMaxRuntime] = useState<number>(140);
  const [creating, setCreating] = useState(false);

  // Voting state (personal votes map & room-wide allVotes array)
  const [votedMap, setVotedMap] = useState<Record<string, 'yes' | 'no'>>({});
  const [allVotes, setAllVotes] = useState<any[]>([]);
  // How strongly this member feels about their vote (1 = mild, 5 = strong).
  const [voteStrength, setVoteStrength] = useState(4);

  // Add show / movie modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingTitleId, setAddingTitleId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Real-time transport + final decision payload
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [aiPitch, setAiPitch] = useState<string | null>(null);
  const [aiPitchGenerated, setAiPitchGenerated] = useState(false);
  const [compromiseScores, setCompromiseScores] = useState<
    { titleId: string; score: number; yesCount: number; noCount: number }[]
  >([]);
  const joinedRoomIdRef = useRef<string | null>(null);

  // Load / join session on mount or code change
  useEffect(() => {
    if (initialCode) {
      loadSessionByCode(initialCode);
    }
  }, [initialCode, isAuthenticated]);

  /**
   * Real-time synchronisation.
   *
   * Votes and the final pick are pushed over Socket.IO as they happen. The
   * previous implementation polled the *write* endpoint (POST /sessions/join)
   * every 2.5 seconds, which meant a database write per participant per tick.
   */
  useEffect(() => {
    if (!isAuthenticated || !activeSession || activeSession.status !== 'open') return;

    let cancelled = false;
    const roomSessionId = activeSession._id;

    const attach = async () => {
      const connected = await socketService.whenConnected();
      if (cancelled) return;
      setRealtimeConnected(connected);
      if (!connected) return;

      // Join the room so we receive broadcasts for this session.
      const ack = await socketService.joinSession(activeSession.joinCode);
      if (cancelled) return;
      if (ack.ok && ack.sessionId) {
        joinedRoomIdRef.current = ack.sessionId;
        if (ack.votes) setAllVotes(ack.votes);
      }

      socketService.onVoteUpdated((payload) => {
        if (payload.sessionId !== roomSessionId) return;
        setAllVotes(payload.votes || []);
        syncMyVotes(payload.votes || []);
      });

      socketService.onParticipantJoined(() => {
        // Someone joined - refresh the participant list (cheap, once per event).
        loadSessionByCode(activeSession.joinCode, true);
      });

      socketService.onSessionFinalized((payload) => {
        if (payload?.session?._id !== roomSessionId) return;
        applyFinalizedPayload(payload);
      });

      socketService.onSessionError((payload) => {
        if (!payload?.error) return;
        setError(payload.error);
        setTimeout(() => setError(null), 5000);
      });
    };

    attach();

    return () => {
      cancelled = true;
      if (joinedRoomIdRef.current) {
        socketService.leaveSession(joinedRoomIdRef.current);
        joinedRoomIdRef.current = null;
      }
      socketService.disconnect();
      setRealtimeConnected(false);
    };
  }, [activeSession?._id, activeSession?.status, activeSession?.joinCode, isAuthenticated]);

  const syncMyVotes = (votes: any[]) => {
    if (!user) return;
    const myVotes: Record<string, 'yes' | 'no'> = {};
    votes.forEach((v: any) => {
      const vUserId = (v.user?._id || v.user)?.toString();
      if (vUserId === user._id) {
        const tId = (v.title?._id || v.title)?.toString();
        myVotes[tId] = v.reaction;
      }
    });
    setVotedMap(myVotes);
  };

  const applyFinalizedPayload = (payload: any) => {
    if (payload?.session) setActiveSession(payload.session as GroupSessionDetail);
    if (payload?.winnerId !== undefined) {
      setActiveSession((prev) =>
        prev ? ({ ...prev, finalPick: payload.winnerId } as GroupSessionDetail) : prev
      );
    }
    if (Array.isArray(payload?.scores)) setCompromiseScores(payload.scores);
    if (payload?.aiPitch) {
      setAiPitch(payload.aiPitch);
      setAiPitchGenerated(!!payload.aiPitchGenerated);
    }
  };

  const loadSessionByCode = async (code: string, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }

    try {
      const cleanCode = code.toUpperCase().trim();
      let data: { session: GroupSessionDetail; votes?: any[] };

      // Joining persists the participant; guests fall back to a public read.
      if (isAuthenticated) {
        try {
          data = await sessionService.joinSession(cleanCode);
        } catch {
          data = await sessionService.getSessionByCode(cleanCode);
        }
      } else {
        data = await sessionService.getSessionByCode(cleanCode);
      }

      if (data?.session) {
        setActiveSession(data.session);

        if (data.votes) {
          setAllVotes(data.votes);
          syncMyVotes(data.votes);
        }
      }
    } catch (err: any) {
      if (!isSilent) {
        setError(err.response?.data?.error || `Could not find room with code ${code}`);
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setSearchParams({ code: joinCodeInput.toUpperCase().trim() });
    loadSessionByCode(joinCodeInput.toUpperCase().trim());
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/group' } } });
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const { session, joinCode } = await sessionService.createSession({
        name: newRoomName.trim(),
        moodFilter: newMood,
        maxRuntime: newMaxRuntime,
      });
      setActiveSession(session);
      setSearchParams({ code: joinCode });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleVote = async (titleId: string, reaction: 'yes' | 'no') => {
    if (!activeSession) return;
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: { pathname: '/group', search: `?code=${activeSession.joinCode}` } },
      });
      return;
    }

    const tIdStr = titleId.toString();

    // Optimistically update personal vote
    setVotedMap((prev) => ({ ...prev, [tIdStr]: reaction }));

    // Optimistically update room-wide allVotes
    if (user) {
      setAllVotes((prev) => {
        const filtered = prev.filter(
          (v) =>
            !(
              (v.user?._id || v.user)?.toString() === user._id &&
              (v.title?._id || v.title)?.toString() === tIdStr
            )
        );
        return [
          ...filtered,
          {
            _id: `temp-${Date.now()}`,
            session: activeSession._id,
            title: tIdStr,
            user: { _id: user._id, name: user.name, avatar: user.avatar },
            reaction,
            strength: voteStrength,
          },
        ];
      });
    }

    try {
      // Prefer the socket; fall back to REST if it is not connected. Both paths
      // run the same server-side validation and both broadcast to the room.
      let acked = false;
      if (realtimeConnected) {
        const result = await socketService.castVote(
          activeSession._id,
          tIdStr,
          reaction,
          voteStrength
        );
        if (result.ok) {
          acked = true;
        } else if (result.error) {
          setError(result.error);
          setTimeout(() => setError(null), 5000);
        }
      }

      if (!acked) {
        const { votes } = await sessionService.submitVote(
          activeSession._id,
          tIdStr,
          reaction,
          voteStrength
        );
        if (votes) setAllVotes(votes);
      }
    } catch (err: any) {
      console.error('Failed to submit vote:', err);
      setError(err?.response?.data?.error || 'Could not record your vote.');
      setTimeout(() => setError(null), 5000);
      // Roll the optimistic vote back.
      loadSessionByCode(activeSession.joinCode, true);
    }
  };

  const handleLockSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const result = await sessionService.lockSession(activeSession._id);
      applyFinalizedPayload(result);
      setActiveSession(result.session as GroupSessionDetail);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not finalize session.');
    } finally {
      setLoading(false);
    }
  };

  // Search titles when add show modal opens or query changes
  useEffect(() => {
    if (!showAddModal) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchQuery.trim()) {
      // Load top trending titles as suggestions
      setSearching(true);
      titleService
        .getTrending('all')
        .then((titles) => setSearchResults(titles.slice(0, 8)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await titleService.search(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, showAddModal]);

  const handleAddTitleToShortlist = async (title: Title) => {
    if (!activeSession) return;
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: { pathname: '/group', search: `?code=${activeSession.joinCode}` } },
      });
      return;
    }

    const tId = title._id || title.tmdbId?.toString() || '';
    setAddingTitleId(tId);

    try {
      const res = await sessionService.addTitleToShortlist(activeSession._id, {
        titleId: title._id,
        tmdbId: title.tmdbId,
        type: title.type === 'tv' ? 'tv' : 'film',
        titleData: title,
      });
      if (res?.session) {
        setActiveSession(res.session);
        if (res.votes) {
          setAllVotes(res.votes);
        }
      }
    } catch (err: any) {
      console.error('Failed to add title to shortlist:', err);
    } finally {
      setAddingTitleId(null);
    }
  };

  const copyCodeToClipboard = () => {
    if (!activeSession) return;
    navigator.clipboard.writeText(activeSession.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If inside an active session room:
  if (activeSession) {
    const isHost = user && activeSession.host?._id === user._id;
    const shortlistIds = new Set(
      (activeSession.shortlist || []).map((t: any) => (t._id || t.tmdbId || '').toString())
    );

    // Strict deduplication of participants by ID
    const uniqueParticipants = (activeSession.participants || []).filter(
      (p: any, index: number, self: any[]) => {
        const pId = (p?._id || p?.email || p)?.toString();
        return index === self.findIndex((t: any) => (t?._id || t?.email || t)?.toString() === pId);
      }
    );

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Room Header Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {activeSession.status === 'open' ? 'Live Voting Room' : 'Decision Locked'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                {activeSession.name || 'Watch Decision Party'}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Hosted by</span>
                <span className="text-violet-300 font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  {activeSession.host?.name || 'Curator'}
                </span>
              </p>
            </div>

            {/* Room Code Badge */}
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-2 px-3 self-start sm:self-auto">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Room Code</p>
                <p className="text-xl font-mono font-black tracking-widest text-cyan-400">
                  {activeSession.joinCode}
                </p>
              </div>
              <button
                onClick={copyCodeToClipboard}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors ml-2 cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Participants Row with Real-Time Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Users className="w-4 h-4 text-indigo-400" /> Participants (
                {uniqueParticipants.length}):
              </span>
              {/* Honest connection indicator: reflects the real socket state. */}
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                  realtimeConnected
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={
                  realtimeConnected
                    ? 'Live updates are streaming over Socket.IO'
                    : 'Live updates unavailable - falling back to manual refresh'
                }
              >
                {realtimeConnected ? 'LIVE' : 'OFFLINE'}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {uniqueParticipants.map((p: any) => {
                  const isRoomHost = activeSession.host?._id === p._id;
                  const isMe = user && user._id === p._id;

                  return (
                    <div
                      key={p._id || p.email}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-medium text-slate-300 shadow-sm"
                      title={p.name}
                    >
                      <img
                        src={
                          p.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            p.name || 'P'
                          )}&background=4f46e5&color=fff`
                        }
                        alt={p.name}
                        className="w-5 h-5 rounded-full object-cover border border-slate-700"
                      />
                      <span className="text-[11px] font-semibold text-white">
                        {p.name}
                        {isMe && <span className="text-indigo-400 text-[10px] ml-1">(You)</span>}
                      </span>
                      {isRoomHost && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                          Host
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSession(null);
                setSearchParams({});
              }}
              className="text-xs text-slate-400 hover:text-white shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Exit Room
            </button>
          </div>
        </div>

        {/* Final Winning Decision Banner */}
        {activeSession.status === 'closed' && activeSession.finalPick && (
          <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={activeSession.finalPick.posterUrl}
                alt={activeSession.finalPick.name}
                className="w-36 h-52 object-cover rounded-2xl shadow-2xl ring-2 ring-amber-400/50"
              />
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>The Group Compromise Winner</span>
                </div>
                <h2 className="text-3xl font-black text-white">{activeSession.finalPick.name}</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeSession.finalPick.synopsis || activeSession.finalPick.overview}
                </p>
                <div className="pt-2">
                  <Link
                    to={`/title/${activeSession.finalPick._id || activeSession.finalPick.tmdbId}`}
                    className="inline-flex items-center gap-2 py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/25"
                  >
                    <span>View title &amp; reviews</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Genuine AI compromise pitch, generated on lock. Previously
                    this label was backed by a fixed English string in
                    social.service.ts. */}
                {aiPitch && (
                  <div className="mt-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
                    <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      AI Compromise Verdict
                      {/* Honest provenance: only claim AI wrote it if it did. */}
                      <span
                        className={`text-[9px] font-bold normal-case ${
                          aiPitchGenerated ? 'text-emerald-400/80' : 'text-slate-500'
                        }`}
                      >
                        {aiPitchGenerated ? 'AI-generated' : 'classic CineCircle verdict (AI unavailable)'}
                      </span>
                    </p>
                    <p className="text-xs text-cyan-100/90 leading-relaxed italic">
                      &ldquo;{aiPitch}&rdquo;
                    </p>
                  </div>
                )}

                {/* Compromise score breakdown: the actual per-title scores. */}
                {compromiseScores.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Compromise scores (Σ strength ÷ participants)
                    </p>
                    <div className="space-y-1">
                      {compromiseScores
                        .slice()
                        .sort((a, b) => b.score - a.score)
                        .map((s) => {
                          const entry = (activeSession.shortlist || []).find(
                            (t: any) => (t._id || t).toString() === s.titleId
                          );
                          return (
                            <div
                              key={s.titleId}
                              className="flex items-center justify-between text-[11px]"
                            >
                              <span className="text-slate-300 truncate">
                                {entry?.name || s.titleId}
                              </span>
                              <span
                                className={`font-bold shrink-0 ml-2 ${
                                  s.score > 0
                                    ? 'text-emerald-400'
                                    : s.score < 0
                                      ? 'text-rose-400'
                                      : 'text-slate-500'
                                }`}
                              >
                                {s.score > 0 ? '+' : ''}
                                {s.score}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Shortlist Candidates with Live Voting & Add Show Button */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Candidate Shortlist ({(activeSession.shortlist || []).length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                • Vote yes or no to calculate compromise
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Add Show / Movie Button (Available to ALL participants & host) */}
              {activeSession.status === 'open' && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="py-1.5 px-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Show / Movie</span>
                </button>
              )}

              {/* Host Lock Decision Button */}
              {isHost && activeSession.status === 'open' && (
                <button
                  onClick={handleLockSession}
                  className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Lock & Calculate Winner</span>
                </button>
              )}
            </div>
          </div>

          {/* Vote intensity control - feeds the weighted compromise formula */}
          {isAuthenticated && activeSession.status === 'open' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">
                How strongly do you feel?
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setVoteStrength(n)}
                    title={['Mild', 'Somewhat', 'Moderate', 'Strong', 'Absolute'][n - 1]}
                    className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      voteStrength >= n
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500">
                {['Mild', 'Somewhat', 'Moderate', 'Strong', 'Absolute'][voteStrength - 1]} — each
                vote counts {voteStrength} towards the compromise score
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(activeSession.shortlist || []).map((title: any) => {
              const tKey = (title._id || title.tmdbId || '').toString();
              const myVote = votedMap[tKey];

              // Find all votes for this specific candidate
              const titleVotes = allVotes.filter(
                (v) => (v.title?._id || v.title)?.toString() === tKey
              );
              const yesVotes = titleVotes.filter((v) => v.reaction === 'yes');
              const noVotes = titleVotes.filter((v) => v.reaction === 'no');
              const totalParticipantsCount = Math.max(1, uniqueParticipants.length);

              return (
                <div
                  key={tKey}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition-all shadow-md"
                >
                  <div>
                    <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                      <img
                        src={title.backdropUrl || title.posterUrl}
                        alt={title.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <Link
                          to={`/title/${title._id || title.tmdbId}`}
                          className="text-base font-black text-white hover:text-indigo-400 transition-colors line-clamp-1"
                        >
                          {title.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>{title.releaseYear}</span>
                          <span>•</span>
                          <span>
                            {title.runtimeMinutes
                              ? `${title.runtimeMinutes}m`
                              : title.type === 'tv'
                              ? 'TV Series'
                              : 'Movie'}
                          </span>
                          {title.voteAverage && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {Number(title.voteAverage).toFixed(1)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {title.synopsis || title.overview || 'No overview available.'}
                      </p>
                    </div>
                  </div>

                  {/* Live Group Votes Indicator Bar */}
                  {activeSession.status === 'open' && (
                    <div className="px-4 py-2.5 bg-slate-950/70 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          {yesVotes.length > 0 ? (
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {yesVotes.length} Loved
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">0 Loved</span>
                          )}

                          {noVotes.length > 0 && (
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              • <ThumbsDown className="w-3 h-3 text-red-400" /> {noVotes.length} Pass
                            </span>
                          )}
                        </div>

                        {/* Avatars of participants who voted on this title */}
                        {titleVotes.length > 0 ? (
                          <div
                            className="flex items-center -space-x-1.5"
                            title={`${titleVotes.length} participant(s) voted`}
                          >
                            {yesVotes.map((v: any, vIdx: number) => {
                              const u = v.user;
                              const isMe = user && (u?._id || u) === user._id;
                              const name = u?.name || (isMe ? user?.name : 'Participant');
                              const avatar = u?.avatar || (isMe ? user?.avatar : null);
                              return (
                                <img
                                  key={v._id || `yes-${vIdx}`}
                                  src={
                                    avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      name
                                    )}&background=10b981&color=fff`
                                  }
                                  alt={name}
                                  title={`${name}: Loved (Yes)`}
                                  className="w-5 h-5 rounded-full border-2 border-emerald-500 object-cover ring-1 ring-slate-950"
                                />
                              );
                            })}
                            {noVotes.map((v: any, vIdx: number) => {
                              const u = v.user;
                              const isMe = user && (u?._id || u) === user._id;
                              const name = u?.name || (isMe ? user?.name : 'Participant');
                              const avatar = u?.avatar || (isMe ? user?.avatar : null);
                              return (
                                <img
                                  key={v._id || `no-${vIdx}`}
                                  src={
                                    avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      name
                                    )}&background=ef4444&color=fff`
                                  }
                                  alt={name}
                                  title={`${name}: Pass (No)`}
                                  className="w-5 h-5 rounded-full border-2 border-red-500 object-cover opacity-75 ring-1 ring-slate-950"
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">Waiting for votes</span>
                        )}
                      </div>

                      {/* Visual Live Compromise Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          style={{ width: `${(yesVotes.length / totalParticipantsCount) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500/80 transition-all duration-300"
                          style={{ width: `${(noVotes.length / totalParticipantsCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Personal Voting Action Buttons Footer */}
                  {activeSession.status === 'open' && (
                    <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleVote(title._id || title.tmdbId, 'yes')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          myVote === 'yes'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{myVote === 'yes' ? 'Loved' : 'Vote Yes'}</span>
                      </button>

                      <button
                        onClick={() => handleVote(title._id || title.tmdbId, 'no')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          myVote === 'no'
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{myVote === 'no' ? 'Voted No' : 'Pass'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Show / Movie to Shortlist Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-full sm:max-w-lg lg:max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-3 sm:p-4 lg:p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Add Show or Movie to Shortlist</h3>
                    <p className="text-xs text-slate-400">
                      Search movies & TV series to add to the voting pool
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="p-3 sm:p-4 lg:p-5 border-b border-slate-800/60 bg-slate-900/30">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles (e.g. Stranger Things, Lucifer, Inception, Breaking Bad)..."
                    autoFocus
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {searching ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-xs font-medium">Searching cinema database...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    {searchQuery ? `No results found for "${searchQuery}"` : 'No titles found.'}
                  </div>
                ) : (
                  searchResults.map((title: Title) => {
                    const tKey = (title._id || title.tmdbId || '').toString();
                    const isAlreadyIn = shortlistIds.has(tKey);
                    const isAdding = addingTitleId === tKey;

                    return (
                      <div
                        key={tKey}
                        className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-all"
                      >
                        {/* Thumbnail & Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                            {title.posterUrl || title.backdropUrl ? (
                              <img
                                src={title.posterUrl || title.backdropUrl}
                                alt={title.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Film className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {title.name}
                              </h4>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 shrink-0 uppercase">
                                {title.type === 'tv' ? 'TV' : 'Movie'}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                              {title.releaseYear && <span>{title.releaseYear}</span>}
                              {title.genres && title.genres.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[140px] sm:max-w-xs">
                                    {title.genres.slice(0, 2).join(', ')}
                                  </span>
                                </>
                              )}
                              {title.voteAverage && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    {Number(title.voteAverage).toFixed(1)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Action: Add or Already Added */}
                        <div className="shrink-0">
                          {isAlreadyIn ? (
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>In Shortlist</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isAdding}
                              onClick={() => handleAddTitleToShortlist(title)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                            >
                              {isAdding ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Adding...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add to Vote</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
                <span>All room participants can add candidates before voting locks.</span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lobby: Create or Join
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>Real-time Watch Circles</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
          Group Decision Mode
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
          Collaborate with friends to resolve what to watch using weighted compromise scoring.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Session Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Session</h3>
              <p className="text-xs text-slate-400">Host a watch party decision room</p>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Room Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Friday Sci-Fi Marathon"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-violet-400" /> Mood Vibe
                </label>
                <select
                  value={newMood}
                  onChange={(e) => setNewMood(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Mind-Bending">Mind-Bending</option>
                  <option value="Comfort">Comfort</option>
                  <option value="Gripping">Gripping</option>
                  <option value="Fun">Fun</option>
                  <option value="Stunning">Stunning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" /> Max Runtime
                </label>
                <select
                  value={newMaxRuntime}
                  onChange={(e) => setNewMaxRuntime(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={90}>Under 90 min</option>
                  <option value={120}>Under 120 min</option>
                  <option value={150}>Under 150 min</option>
                  <option value={200}>Any Runtime</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Room...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Host Decision Room</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Join Session Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Join Existing Session</h3>
                <p className="text-xs text-slate-400">Enter a 6-character room code</p>
              </div>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. SCI890"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm font-mono tracking-widest font-black text-cyan-400 uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !joinCodeInput.trim()}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Watch Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-500 text-center">
              💡 Tip: Try joining our live demo room: <strong className="text-cyan-400 font-mono">SCI890</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
