import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Tv,
  Film,
  Music,
  MessageSquare,
  Bookmark,
  Users,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { titleService } from '../services/title.service';
import type { Title } from '../types';
import { StreamingBadge } from '../components/common/StreamingBadge';
import { useAppSelector } from '../hooks/useAppRedux';

export const TitleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await titleService.getTitleDetails(id);
        setTitle(data);
      } catch (err: any) {
        console.error('Failed to load title details:', err);
        setError('Failed to load title details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const added = await titleService.addComment(
        title?._id || id,
        newComment.trim(),
        hasSpoiler
      );

      if (title) {
        setTitle({
          ...title,
          comments: [added, ...(title.comments || [])],
        });
      }
      setNewComment('');
      setHasSpoiler(false);
    } catch (err: any) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleSpoiler = (commentId: string) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400">Loading film details & streaming sources...</p>
      </div>
    );
  }

  if (error || !title) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Title Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested movie or series could not be retrieved from the catalogue.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 animate-in fade-in duration-300">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-2xl">
        {/* Backdrop Image */}
        {title.backdropUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={title.backdropUrl}
              alt={title.name}
              className="w-full h-full object-cover opacity-25 filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Poster */}
          <div className="w-36 sm:w-48 md:w-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-slate-800 bg-slate-950">
            {title.posterUrl ? (
              <img
                src={title.posterUrl}
                alt={title.name}
                className="w-full h-auto aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center text-slate-600">
                <Film className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {title.type === 'film' ? 'Film' : 'TV Series'}
              </span>
              {title.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit'] tracking-tight">
                {title.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-medium">
                {title.releaseYear && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {title.releaseYear}
                  </span>
                )}
                {title.runtimeMinutes > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {title.runtimeMinutes} min
                  </span>
                )}
                {title.voteAverage ? (
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {title.voteAverage} / 10
                  </span>
                ) : null}
              </div>
            </div>

            {/* Mood Tags */}
            {title.moodTags && title.moodTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {title.moodTags.map((mood) => (
                  <span
                    key={mood}
                    className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-0.5 rounded-lg"
                  >
                    #{mood}
                  </span>
                ))}
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-3">
              <Link
                to="/group"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Add to Group Circle</span>
              </Link>
              <Link
                to="/watchlist"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-xs transition-all"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Save to Watchlist</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Synopsis, Cast, Seasons, Discussion */}
        <div className="lg:col-span-2 space-y-8">
          {/* Synopsis */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Storyline</h2>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {title.synopsis || 'No synopsis available for this title.'}
            </p>
          </div>

          {/* Cast */}
          {title.cast && title.cast.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Top Cast & Characters
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {title.cast.map((actor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2.5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                      {actor.photoUrl ? (
                        <img
                          src={actor.photoUrl}
                          alt={actor.actorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500">
                          {actor.actorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{actor.actorName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{actor.characterName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Seasons & Episodes Breakdown (if TV) */}
          {title.type === 'tv' && title.seasons && title.seasons.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                <Tv className="w-4 h-4 text-indigo-400" />
                <span>Seasons & Episodes</span>
              </div>
              <div className="space-y-4">
                {title.seasons.map((season) => (
                  <div key={season.seasonNumber} className="space-y-2">
                    <h3 className="text-xs font-bold text-white">Season {season.seasonNumber}</h3>
                    <div className="space-y-2">
                      {season.episodes.map((ep) => (
                        <div
                          key={ep.episodeNumber}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-200">
                              Episode {ep.episodeNumber}: {ep.name}
                            </span>
                            <span className="text-[11px] text-slate-500">{ep.runtimeMinutes} min</span>
                          </div>
                          {ep.summary && (
                            <p className="text-[11px] text-slate-400 leading-normal">{ep.summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion & Enthusiast Comments */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Discussion & Reviews</span>
              </div>
              <span className="text-xs text-slate-500">
                {title.comments?.length || 0} comment{title.comments?.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Comment Form */}
            {isAuthenticated ? (
              <form onSubmit={handlePostComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your review or discussion point..."
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSpoiler}
                      onChange={(e) => setHasSpoiler(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Contains Spoilers
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    {submittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Post Review</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                <p className="text-xs text-slate-300">Join the discussion</p>
                <p className="text-[11px] text-slate-500">
                  <Link to="/login" className="text-indigo-400 hover:underline">
                    Sign in
                  </Link>{' '}
                  or{' '}
                  <Link to="/register" className="text-indigo-400 hover:underline">
                    create an account
                  </Link>{' '}
                  to leave your review.
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 pt-2">
              {title.comments && title.comments.length > 0 ? (
                title.comments.map((comment) => {
                  const isSpoiler = comment.containsSpoilers;
                  const isRevealed = revealedSpoilers[comment._id];

                  return (
                    <div
                      key={comment._id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{comment.user?.name || 'User'}</span>
                          {comment.user?.role === 'admin' && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                              Curator
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {isSpoiler && !isRevealed ? (
                        <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-center justify-between text-xs text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Review marked as spoiler
                          </span>
                          <button
                            onClick={() => toggleSpoiler(comment._id)}
                            className="text-xs text-amber-400 underline cursor-pointer"
                          >
                            Reveal
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Streaming Providers & Soundtracks */}
        <div className="space-y-6">
          {/* Where to Watch */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-cyan-400" /> Where to Stream
            </h2>

            {title.watchProviders && title.watchProviders.length > 0 ? (
              <div className="space-y-2">
                {title.watchProviders.map((wp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <StreamingBadge service={wp.service} size="sm" />
                      <span className="text-xs font-semibold text-slate-200">{wp.service}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      {wp.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Streaming availability not yet indexed for this region.
              </p>
            )}
          </div>

          {/* Curated Soundtracks & Score */}
          {title.soundtracks && title.soundtracks.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-pink-400" /> Soundtracks & Score
              </h2>
              <div className="space-y-2">
                {title.soundtracks.map((track, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.songName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                    </div>
                    {track.episodeRef && (
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">
                        {track.episodeRef}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
