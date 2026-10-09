import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GroupSession, Title } from '../../types';

interface SessionState {
  currentSession: GroupSession | null;
  votes: Record<string, { reaction: 'yes' | 'no'; strength: number }>;
  finalPick: Title | null;
  loading: boolean;
}

const initialState: SessionState = {
  currentSession: null,
  votes: {},
  finalPick: null,
  loading: false,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<GroupSession | null>) => {
      state.currentSession = action.payload;
    },
    recordLocalVote: (
      state,
      action: PayloadAction<{ titleId: string; reaction: 'yes' | 'no'; strength: number }>
    ) => {
      state.votes[action.payload.titleId] = {
        reaction: action.payload.reaction,
        strength: action.payload.strength,
      };
    },
    setFinalPick: (state, action: PayloadAction<Title | null>) => {
      state.finalPick = action.payload;
    },
    resetSession: (state) => {
      state.currentSession = null;
      state.votes = {};
      state.finalPick = null;
    },
  },
});

export const { setCurrentSession, recordLocalVote, setFinalPick, resetSession } =
  sessionSlice.actions;

export default sessionSlice.reducer;
