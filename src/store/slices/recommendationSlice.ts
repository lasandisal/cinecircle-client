import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Title } from '../../types';

interface RecommendationState {
  shortlist: Title[];
  loading: boolean;
  activeMood: string | null;
  availableTimeMinutes: number | null;
}

const initialState: RecommendationState = {
  shortlist: [],
  loading: false,
  activeMood: null,
  availableTimeMinutes: null,
};

export const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState,
  reducers: {
    setPromptContext: (
      state,
      action: PayloadAction<{ mood: string; availableTime: number }>
    ) => {
      state.activeMood = action.payload.mood;
      state.availableTimeMinutes = action.payload.availableTime;
    },
    setShortlist: (state, action: PayloadAction<Title[]>) => {
      state.shortlist = action.payload;
    },
    setRecommendationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearRecommendations: (state) => {
      state.shortlist = [];
      state.activeMood = null;
      state.availableTimeMinutes = null;
    },
  },
});

export const {
  setPromptContext,
  setShortlist,
  setRecommendationLoading,
  clearRecommendations,
} = recommendationSlice.actions;

export default recommendationSlice.reducer;
