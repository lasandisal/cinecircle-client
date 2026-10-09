import React, { useState } from 'react';
import { Star, Heart, MessageSquare, Bookmark, Share2, Sparkles, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    year: number;
    poster: string;
    genres: string[];
    runtime: string;
    streamingServices: string[];
  };
  rating: number;
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
    <article className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 space-y-4 transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-md">
      {/* Header: User Info & Mutual Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover border border-slate-700"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white hover:text-indigo-400 cursor-pointer">
                {post.author.name}
              </span>
              <span className="text-xs text-slate-500">{post.author.handle}</span>
            </div>
            <span className="text-[11px] text-slate-500">{post.timestamp}</span>
          </div>
        </div>

        {post.author.mutualCount && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {post.author.mutualCount} mutual titles
          </span>
        )}
      </div>

      {/* Main Content: Film Card & Rating */}
      <div className="flex gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-850">
        <Link to={`/title/${post.titleData.id}`} className="shrink-0 group">
          <img
            src={post.titleData.poster}
            alt={post.titleData.name}
            className="w-20 h-28 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200"
          />
        </Link>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/title/${post.titleData.id}`}
              className="text-base font-bold text-white hover:text-indigo-400 transition-colors truncate"
            >
              {post.titleData.name}
              <span className="text-xs text-slate-400 font-normal ml-1.5">
                ({post.titleData.year})
              </span>
            </Link>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= post.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
            <span className="text-xs font-bold text-amber-400 ml-1">
              {post.rating}.0
            </span>
          </div>

          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic">
            "{post.reviewText}"
          </p>

          {/* Streaming badges */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Tv className="w-3 h-3 text-cyan-400" /> Watch On:
            </span>
            {post.titleData.streamingServices.map((service) => (
              <span
                key={service}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Social Micro-Interaction Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs text-slate-400">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 transition-colors ${
            liked ? 'text-rose-500 font-semibold' : 'hover:text-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
          <span>{likes}</span>
        </button>

        <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentsCount} comments</span>
        </button>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`flex items-center gap-1.5 transition-colors ${
            bookmarked ? 'text-amber-400 font-semibold' : 'hover:text-amber-300'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400' : ''}`} />
          <span>{bookmarked ? 'Watchlisted' : 'Save'}</span>
        </button>

        <Link
          to={`/group`}
          className="flex items-center gap-1 hover:text-indigo-400 text-indigo-400/90 font-medium transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Start Circle</span>
        </Link>
      </div>
    </article>
  );
};
