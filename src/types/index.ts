export type UserRole = 'user' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  subscribedServices: string[];
  fatigueCount: number;
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
  moodTags: string[];
  cast: {
    actorName: string;
    characterName: string;
    photoUrl?: string;
    bio?: string;
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
