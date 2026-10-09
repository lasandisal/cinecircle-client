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
  }): Promise<{ shortlist: RecommendationResult[]; criteria: any }> {
    const res = await api.post('/recommendations/solo', params);
    return res.data.data;
  },

  /**
   * Break decision fatigue with single decisive pick
   */
  async getFatiguePick(): Promise<any> {
    const res = await api.post('/recommendations/fatigue');
    return res.data.data.championPick;
  },
};
