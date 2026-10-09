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
  tasteProfile?: string;
}

export interface Title {
  _id: string;
  tmdbId: number;
  name: string;
  type: 'tv' | 'film';
  genres: string[];
  synopsis: string;
  runtimeMinutes: number;
  posterUrl: string;
  backdropUrl?: string;
  releaseYear?: number;
  voteAverage?: number;
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
    }[];
  }[];
  soundtracks?: {
    _id?: string;
    songName: string;
    artist: string;
    episodeRef?: string;
    popularityRank: number;
  }[];
  comments?: {
    _id: string;
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
    containsSpoilers?: boolean;
    createdAt: string;
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
