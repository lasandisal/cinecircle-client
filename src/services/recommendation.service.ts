import { api } from './api';

export interface RecommendationResult {
  id: string;
  tmdbId?: number;
  name: string;
  type: 'film' | 'tv';
  releaseYear?: number;
  posterUrl: string;
  backdropUrl?: string;
  genres: string[];
  runtimeMinutes?: number;
  voteAverage?: number;
  synopsis?: string;
  matchScore: number;
  matchReason: string;
  streamingServices: string[];
}

export const recommendationService = {
  /**
   * Get real solo recommendations tailored by mood, duration, or natural AI prompt
   */
  async getSoloRecommendations(params: {
    mood?: string;
    duration?: number;
    type?: string;
    aiPrompt?: string;
  }): Promise<{
    shortlist: RecommendationResult[];
    criteria: {
      mood: string;
      maxRuntime: number;
      targetGenres: string[];
      targetKeywords: string[];
      requestedType: 'film' | 'tv' | null;
      rationaleSource: 'gemini' | 'fallback' | 'none';
      recommendationSource: 'tmdb' | 'catalogue' | 'mixed';
      queryDurationMs?: number;
    };
  }> {
    const res = await api.post('/recommendations/solo', params, {
      timeout: 60_000,
    });
    return res.data.data;
  },

  /**
   * Break decision fatigue with single decisive pick
   */
  async getFatiguePick(): Promise<any> {
    const res = await api.post('/recommendations/fatigue', undefined, {
      timeout: 60_000,
    });
    return res.data.data.championPick;
  },
};
