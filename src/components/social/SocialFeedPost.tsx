import React, { useState } from 'react';
import { Star, Heart, MessageSquare, Bookmark, Share2, Sparkles, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StreamingBadge } from '../common/StreamingBadge';

export interface FeedPostProps {
  id: string;
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
}

export const SocialFeedPost: React.FC<{ post: FeedPostProps }> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likesCount);
  const [bookmarked, setBookmarked] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
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

        {post.author.mutualCount && (
          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{post.author.mutualCount} mutuals</span>
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

          {/* Star Rating - only shown when the reviewer actually rated.
              The backend used to send `rating: c.rating || 5`, so every
              unrated review displayed as a perfect 5 stars. */}
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

          {/* Streaming badges - real availability only.
              These used to be a hardcoded ['Max','Prime Video','Netflix']
              on every single post regardless of the title. */}
          {post.titleData.streamingServices?.length > 0 ? (
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-0.5">
                <Tv className="w-2.5 h-2.5 text-cyan-400" /> Watch On:
              </span>
              {post.titleData.streamingServices.map((service) => (
                <StreamingBadge key={service} service={service} size="sm" />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[9px] sm:text-[10px] text-slate-600 flex items-center gap-0.5">
                <Tv className="w-2.5 h-2.5 text-slate-600" /> Streaming availability unknown
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Social Micro-Interaction Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] sm:text-xs text-slate-400">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg active:scale-95 transition-all ${
            liked ? 'text-rose-500 font-semibold' : 'hover:text-rose-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${liked ? 'fill-rose-500' : ''}`} />
          <span>{likes}</span>
        </button>

        <button className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg active:scale-95 hover:text-indigo-400 transition-all">
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{post.commentsCount}</span>
        </button>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg active:scale-95 transition-all ${
            bookmarked ? 'text-amber-400 font-semibold' : 'hover:text-amber-300'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${bookmarked ? 'fill-amber-400' : ''}`} />
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <Link
          to={`/group`}
          className="flex items-center gap-1 py-1 px-1.5 rounded-lg active:scale-95 hover:text-indigo-400 text-indigo-400/90 font-medium transition-all"
        >
          <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Circle</span>
        </Link>
      </div>
    </article>
  );
};
