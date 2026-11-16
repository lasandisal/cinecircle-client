import React, { useState, useEffect } from 'react';
import { Star, Heart, MessageSquare, Bookmark, Share2, Sparkles, BarChart2, Check, X, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { titleService } from '../../services/title.service';
import { useAppSelector } from '../../hooks/useAppRedux';

export interface FeedPostProps {
  id: string;
  /** Whether the currently signed-in user has already liked this post. */
  likedByMe?: boolean;
  author: {
    name: string;
    handle: string;
    avatar: string;
    isTasteMatch?: boolean;
    mutualCount?: number;
  };
  titleData: {
    id: string;
    name: string;
    /** null when the catalogue has no year for this title. */
    year: number | null;
    poster: string;
    genres: string[];
    runtime: string | null;
    /** Real providers, or [] when we have no availability data. */
    streamingServices: string[];
  };
  /** null when the reviewer did not rate the title. */
  rating: number | null;
  reviewText: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  /** Optional embedded poll attached to this review/comment. */
  poll?: {
    question: string;
    options: { text: string; votesCount: number; userHasVoted: boolean }[];
  };
}

/** Small inline avatar + name for likers/reply lists */
const UserItem: React.FC<{ user: { id: string; name: string; handle?: string; avatar?: string } }> = ({ user }) => (
  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
    <img
      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
      alt={user.name}
      className="w-7 h-7 rounded-full object-cover shrink-0"
    />
    <div className="min-w-0 flex-1">
      <div className="text-xs font-bold text-white truncate">{user.name}</div>
      {user.handle && (
        <div className="text-[10px] text-slate-500 truncate">{user.handle}</div>
      )}
    </div>
  </div>
);

/**
 * Modal overlay showing who liked a comment (Instagram-style).
 */
const LikersModal: React.FC<{
  open: boolean;
  onClose: () => void;
  likers: { id: string; name: string; handle?: string; avatar?: string }[];
  total: number;
}> = ({ open, onClose, likers, total }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Likes ({total})</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {likers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No likes yet
          </div>
        ) : (
          <div className="space-y-1">
            {likers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Modal overlay showing replies to a comment.
 */
const RepliesModal: React.FC<{
  open: boolean;
  onClose: () => void;
  replies: { id: string; user: { name: string; avatar?: string }; text: string; createdAt: string }[];
}> = ({ open, onClose, replies }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Replies ({replies.length})</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {replies.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No replies yet
          </div>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800/50">
                <img
                  src={reply.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.user.name)}&background=6366f1&color=fff`}
                  alt={reply.user.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{reply.user.name}</div>
                  <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                    {reply.text}
                  </p>
                  <div className="text-[9px] text-slate-500 mt-1">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const SocialFeedPost: React.FC<{ post: FeedPostProps }> = ({ post }) => {
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likes, setLikes] = useState(post.likesCount);
  const [bookmarked, setBookmarked] = useState(false);
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id || (currentUser as any)?.id || null;

  // Sync liked state from backend prop when it changes (e.g. after parent re-render)
  useEffect(() => {
    setLiked(post.likedByMe ?? false);
    setLikes(post.likesCount);
  }, [post.likedByMe, post.likesCount]);

  // Error states for debugging
  const [likeError, setLikeError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [repliesError, setRepliesError] = useState<string | null>(null);

  // Comment input state (reply to THIS post)
  const [commentInputOpen, setCommentInputOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentsCount);

  // Poll state
  const [pollVoting, setPollVoting] = useState(false);
  const [localPoll, setLocalPoll] = useState<{ question: string; options: { text: string; votesCount: number; userHasVoted: boolean }[] } | null>(post.poll ?? null);

  const totalPollVotes = localPoll?.options.reduce((sum, opt) => sum + opt.votesCount, 0) || 0;

  // Likers modal state
  const [likersModalOpen, setLikersModalOpen] = useState(false);
  const [likers, setLikers] = useState<Array<{ id: string; name: string; handle?: string; avatar?: string }>>([]);
  const [likersTotal, setLikersTotal] = useState(0);

  // Replies modal state
  const [repliesModalOpen, setRepliesModalOpen] = useState(false);
  const [replies, setReplies] = useState<Array<{ id: string; user: { name: string; avatar?: string }; text: string; createdAt: string }>>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const toggleLike = async () => {
    setLikeError(null);
    if (liked) {
      // Already liked -> unlike
      setLiked(false);
      setLikes(likes - 1);
      try {
        const result = await titleService.toggleLike(post.id);
        setLikes(result.likesCount);
      } catch (err: any) {
        console.error('Failed to unlike comment:', err);
        setLikeError(err?.response?.data?.error || err?.message || 'Failed to unlike');
        // Revert
        setLiked(true);
        setLikes(likes);
      }
      return;
    }

    // Not liked -> like
    setLiked(true);
    setLikes(likes + 1);
    try {
      const result = await titleService.toggleLike(post.id);
      setLikes(result.likesCount);
    } catch (err: any) {
      console.error('Failed to like comment:', err);
      setLikeError(err?.response?.data?.error || err?.message || 'Failed to like');
      // Revert
      setLiked(false);
      setLikes(likes);
    }
  };

  const handleLikeCountClick = async () => {
    if (likes === 0) return;
    try {
      const data = await titleService.getCommentLikers(post.id);
      setLikers(data.likers || []);
      setLikersTotal(data.total || 0);
      setLikersModalOpen(true);
    } catch (err: any) {
      setLikeError(err?.response?.data?.error || err?.message || 'Failed to load likers');
    }
  };

  const handleCommentCountClick = async () => {
    setRepliesLoading(true);
    try {
      // Fetch replies for this comment (via axios so the API base URL + auth are used)
      const data = await titleService.getCommentReplies(post.id, 1, 20);
      setReplies(data.replies || []);
      setRepliesModalOpen(true);
    } catch (err: any) {
      setRepliesError(err?.response?.data?.error || err?.message || 'Failed to load replies');
    } finally {
      setRepliesLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text || commentSubmitting) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      // parentId = the feed post's comment id -> becomes a REPLY to that post.
      // titleId  = the title the post belongs to.
      await titleService.addComment(post.titleData.id, text, undefined, false, post.id);
      setCommentText('');
      setCommentInputOpen(false);
      setLocalCommentCount((c) => c + 1);
      // Refresh the replies list if the modal is open
      if (repliesModalOpen) {
        const data = await titleService.getCommentReplies(post.id, 1, 20);
        setReplies(data.replies || []);
      }
    } catch (err: any) {
      setCommentError(err?.response?.data?.error || err?.message || 'Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handlePollVote = async (optIdx: number) => {
    if (pollVoting) return;
    setPollVoting(true);
    try {
      // titleService.voteCommentPoll returns the full updated comment object directly
      const updatedComment = await titleService.voteCommentPoll(post.id, optIdx);
      // Sync vote counts from the returned comment's poll
      const updatedPoll = updatedComment?.poll;
      if (updatedPoll) {
        setLocalPoll({
          question: updatedPoll.question,
          options: (updatedPoll.options || []).map((opt: any) => ({
            text: opt.text || opt.optionText,
            votesCount: opt.votesCount ?? opt.votes?.length ?? 0,
            // The vote endpoint returns the RAW poll shape
            // ({ optionText, votes: [userId, ...] }) - it has no
            // `userHasVoted` field. Reading that field directly always
            // returned undefined -> "Your vote" never highlighted until
            // a page refresh. Derive it from the votes array instead.
            userHasVoted: opt.userHasVoted ?? (currentUserId ? !!opt.votes?.includes(currentUserId) : false),
          })),
        });
      }
    } catch (err: any) {
      setPollError(err?.response?.data?.error || err?.message || 'Failed to vote on poll');
    } finally {
      setPollVoting(false);
    }
  };

  return (
    <article className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 transition-all duration-200 backdrop-blur-sm shadow-sm">
      {/* Header: User Info & Mutual Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-700 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white hover:text-indigo-400 cursor-pointer truncate">
                {post.author.name}
              </span>
              <span className="text-[11px] text-slate-500 truncate">{post.author.handle}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 block">{post.timestamp}</span>
          </div>
        </div>

        {post.author.mutualCount ? (
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{post.author.mutualCount} mutuals</span>
          </span>
        ) : (
          /* Comment count for this post - the stray "0" that used to sit here
             was `mutualCount && (...)` rendering the literal 0. */
          <span
            className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
            onClick={handleCommentCountClick}
            title="View comments"
          >
            {/* <MessageSquare className="w-3.5 h-3.5" />
            <span>{localCommentCount}</span> */}
          </span>
        )}
      </div>

      {/* Main Content: Film Card & Rating */}
      <div className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-850">
        <Link to={`/title/${post.titleData.id}`} className="shrink-0 group">
          <img
            src={post.titleData.poster}
            alt={post.titleData.name}
            className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md group-hover:scale-105 active:scale-95 transition-transform duration-200"
          />
        </Link>

        <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/title/${post.titleData.id}`}
              className="text-sm sm:text-base font-bold text-white hover:text-indigo-400 transition-colors truncate"
            >
              {post.titleData.name}
              {post.titleData.year && (
                <span className="text-[11px] sm:text-xs text-slate-400 font-normal ml-1">
                  ({post.titleData.year})
                </span>
              )}
            </Link>
          </div>

          {/* Star Rating - only shown when the reviewer actually rated. */}
          {post.rating != null && post.rating > 0 ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                    star <= (post.rating as number)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
              <span className="text-[11px] sm:text-xs font-bold text-amber-400 ml-1">
                {post.rating}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-600 italic">No rating given</span>
          )}

          <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 leading-relaxed italic">
            "{post.reviewText}"
          </p>

          {/* Embedded Community Poll (if attached) */}
          {localPoll && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                  {localPoll.question}
                </span>
                <span className="text-[10px] text-slate-400">{totalPollVotes} votes</span>
              </div>

              <div className="space-y-2">
                {localPoll.options.map((opt, optIdx) => {
                  const voteCount = opt.votesCount;
                  const percent = totalPollVotes > 0 ? Math.round((voteCount / totalPollVotes) * 100) : 0;
                  const hasVotedThis = opt.userHasVoted;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={hasVotedThis}
                      onClick={() => handlePollVote(optIdx)}
                      className={`w-full relative overflow-hidden rounded-xl p-2.5 border text-left transition-all duration-200 ${
                        hasVotedThis
                          ? 'border-indigo-500 bg-indigo-950/50'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Progress bar */}
                      <div className="absolute left-0 top-0 bottom-0 transition-all duration-300 ${
                        hasVotedThis ? 'bg-indigo-600/30' : 'bg-slate-700/30'
                      }" style={{ width: `${percent}%` }} />
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {hasVotedThis && (
                            <>
                              <Check className="w-3 h-3 text-indigo-400" />
                              <span className="text-indigo-400 text-[10px] font-bold">Your vote</span>
                            </>
                          )}
                          {opt.text}
                        </span>
                        <span className="text-[11px] font-bold ${
                          hasVotedThis ? 'text-indigo-400' : 'text-slate-400'
                        }">
                          {percent}% ({voteCount})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {pollError && (
            <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
              {pollError}
            </span>
          )}
        </div>
      </div>

      {/* Social Micro-Interaction Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] sm:text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            className={`flex items-center gap-1 py-1 px-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
              liked ? 'text-rose-500 font-semibold border border-rose-500/30' : 'hover:text-rose-400 hover:border-rose-500/20'
            }`}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked ? 'fill-rose-500' : ''}`} />
          </button>
          <span
            onClick={handleLikeCountClick}
            className="cursor-pointer hover:underline hover:text-rose-400 transition-colors"
          >
            {likes}
          </span>
        </div>

        {likeError && (
          <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
            {likeError}
          </span>
        )}

        <button
          onClick={() => {
            setCommentInputOpen((v) => !v);
            setCommentError(null);
          }}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
            commentInputOpen ? 'text-indigo-400' : 'hover:text-indigo-400'
          }`}
          aria-label="Comment on this post"
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="cursor-pointer hover:underline hover:text-indigo-400 transition-colors">
            {localCommentCount}
          </span>
        </button>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg active:scale-95 transition-all ${
            bookmarked ? 'text-amber-400 font-semibold' : 'hover:text-amber-300'
          }`}
        >
          {/* <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${bookmarked ? 'fill-amber-400' : ''}`} /> */}
          {/* <span>{bookmarked ? 'Saved' : 'Save'}</span> */}
        </button>

        {/* <Link
          to={`/group`}
          className="flex items-center gap-1 py-1 px-1.5 rounded-lg active:scale-95 hover:text-indigo-400 text-indigo-400/90 font-medium transition-all"
        > */}
          {/* <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> */}
          {/* <span>Circle</span> */}
        {/* </Link> */}
      </div>

      {/* Comment input: reply to THIS post */}
      {commentInputOpen && (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2 items-start">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              placeholder={`Reply to ${post.author.name}...`}
              rows={2}
              maxLength={500}
              className="flex-1 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500">{commentText.length}/500</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCommentInputOpen(false);
                  setCommentText('');
                  setCommentError(null);
                }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || commentSubmitting}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5"
              >
                {commentSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
          {commentError && (
            <span className="text-[10px] text-rose-400 font-semibold block">{commentError}</span>
          )}
        </div>
      )}

      {/* Link to open the replies list */}
      {localCommentCount > 0 && (
        <button
          type="button"
          onClick={handleCommentCountClick}
          className="text-[11px] text-indigo-400 hover:underline text-left"
        >
          View {localCommentCount} {localCommentCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Likers Modal */}
      <LikersModal
        open={likersModalOpen}
        onClose={() => setLikersModalOpen(false)}
        likers={likers}
        total={likersTotal}
      />

      {/* Replies Modal */}
      {repliesLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 flex items-center gap-2">
            <Clock className="w-3 h-3 animate-spin" />
            Loading replies…
          </div>
        </div>
      )}
      {repliesError && !repliesLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-rose-400 flex items-center gap-2">
            <span>⚠️</span>
            {repliesError}
          </div>
        </div>
      )}
      <RepliesModal
        open={repliesModalOpen}
        onClose={() => setRepliesModalOpen(false)}
        replies={replies}
      />
    </article>
  );
};
