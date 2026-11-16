export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  subscribedServices: string[];
  fatigueCount: number;
  avatar?: string;
  handle?: string;
  bio?: string;
  tasteProfile?: any;
  onboarded?: boolean;
}

export interface UserStats {
  watchlistCount: number;
  watchedCount: number;
  circlesCount: number;
  reviewsCount: number;
  mutualWatchedCount?: number;
  connectionsCount?: number;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  connectionRequestId?: string;
  /** Real 0-100 compatibility with the signed-in viewer, or null when unknown. */
  circleCompatibility?: number | null;
  circleCompatibilityBasis?: 'taste' | 'watched' | 'both' | 'none';
  circleCompatibilityExplanation?: string;
}

export interface UserProfileData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  handle: string;
  avatar: string;
  bio: string;
  connectionRequestId?: string;
  subscribedServices: string[];
  stats: UserStats;
  mutualWatchedTitles?: Array<{
    _id: string;
    watchedAt?: string;
    title: {
      _id: string;
      name: string;
      posterUrl: string;
      releaseYear?: number;
      type: string;
      voteAverage?: number;
    };
  }>;
  tasteProfile?: {
    favoriteGenres: string[];
    exclusions: string[];
    favoriteTitles?: string[];
  };
  recentWatched: Array<{
    _id: string;
    watched: boolean;
    starRating?: number;
    watchedAt?: string;
    addedAt: string;
    title: {
      _id: string;
      name: string;
      posterUrl: string;
      releaseYear?: number;
      type: string;
      voteAverage?: number;
    };
  }>;
  savedWatchlist?: Array<{
    _id: string;
    watched: boolean;
    addedAt: string;
    title: {
      _id: string;
      name: string;
      posterUrl: string;
      releaseYear?: number;
      type: string;
      voteAverage?: number;
      genres?: string[];
      overview?: string;
    };
  }>;
  recentReviews: Array<{
    _id: string;
    text: string;
    rating?: number;
    createdAt: string;
    likesCount?: number;
    title: {
      _id: string;
      name: string;
      posterUrl: string;
      releaseYear?: number;
    };
  }>;
  userCircles: Array<{
    _id: string;
    name: string;
    joinCode: string;
    status: string;
    host: {
      _id: string;
      name: string;
      avatar?: string;
    };
    shortlist: Array<{
      _id: string;
      name: string;
      posterUrl: string;
    }>;
    constraints?: {
      maxRuntime?: number;
      moodFilter?: string;
    };
    participants: string[];
  }>;
  isMutualConnection?: boolean;
  connectionStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  isSelf: boolean;
}

/** One entry in the social graph. */
export interface ConnectionPerson {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  role: string;
}

export interface ConnectionGraph {
  connections: ConnectionPerson[];
  counts: {
    connectionsCount: number;
  };
}

export interface CommunityPerson {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar: string;
  bio: string;
  role: string;
  stats: {
    watchedCount: number;
    circlesCount: number;
  };
  /** 0-100, or null when there is not enough shared history to score honestly. */
  matchScore: number | null;
  /** Human readable reason behind the score (or why there is none). */
  matchExplanation?: string;
  /** 'taste' | 'watched' | 'both' | 'none' */
  matchBasis?: 'taste' | 'watched' | 'both' | 'none';
}

export type ReactionEmoji = 'like' | 'love' | 'fire' | 'mindblown' | 'popcorn' | 'sad';

export interface CommentPollOption {
  _id?: string;
  optionText: string;
  votes: string[];
}

export interface CommentPoll {
  question: string;
  options: CommentPollOption[];
}

export interface CommentReaction {
  userId: string;
  emoji: ReactionEmoji;
}

export interface TitleComment {
  _id: string;
  title?: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  text: string;
  rating?: number;
  likesCount?: number;
  /** Whether the currently signed-in viewer has liked this comment. */
  likedByMe?: boolean;
  parentId?: string | null;
  reactions?: CommentReaction[];
  poll?: CommentPoll;
  replies?: TitleComment[];
  containsSpoilers?: boolean;
  /** How many members have flagged this comment for moderation. */
  reportCount?: number;
  /** Whether the signed-in viewer already reported it (disables the button). */
  reportedByMe?: boolean;
  createdAt: string;
}

export interface Title {
  _id: string;
  tmdbId: number;
  imdbId?: string;
  imdbRating?: number | null;
  imdbVotes?: number | null;
  rottenTomatoesRating?: number | null;
  name: string;
  originalName?: string;
  type: 'tv' | 'film';
  genres: string[];
  synopsis: string;
  runtimeMinutes: number;
  posterUrl: string;
  backdropUrl?: string;
  releaseYear?: number;
  voteAverage?: number;
  likesCount?: number;
  isLiked?: boolean;
  moodTags: string[];
  cast: {
    actorName: string;
    characterName: string;
    photoUrl?: string;
    bio?: string;
  }[];
  watchProviders?: {
    _id?: string;
    service: string;
    region: string;
    type: 'subscription' | 'rental' | 'purchase';
  }[];
  seasons?: {
    _id?: string;
    seasonNumber: number;
    episodes: {
      episodeNumber: number;
      name: string;
      summary: string;
      runtimeMinutes: number;
      stillUrl?: string;
      airDate?: string;
      voteAverage?: number;
      featuredSong?: {
        songName: string;
        artist: string;
        sceneRef?: string;
        previewUrl?: string;
        albumArtUrl?: string;
        spotifyUrl?: string;
      };
    }[];
  }[];
  soundtracks?: {
    _id?: string;
    songName: string;
    artist: string;
    episodeRef?: string;
    popularityRank: number;
    previewUrl?: string;
    albumArtUrl?: string;
    spotifyUrl?: string;
  }[];
  comments?: TitleComment[];
  communityWatchers?: {
    userId: string;
    name: string;
    handle?: string;
    avatar?: string;
    starRating?: number;
    watchedAt?: string;
  }[];
}

export interface WatchlistItem {
  _id: string;
  user: string;
  title: Title;
  watched: boolean;
  starRating?: number;
  addedAt: string;
  watchedAt?: string;
}

export interface GroupSession {
  _id: string;
  host: User;
  joinCode: string;
  participants: User[];
  constraints: {
    maxRuntime?: number;
    moodFilter?: string;
  };
  shortlist: Title[];
  status: 'open' | 'closed';
  finalPick?: Title;
}

export interface VotePayload {
  sessionId: string;
  titleId: string;
  reaction: 'yes' | 'no';
  strength: number;
}
