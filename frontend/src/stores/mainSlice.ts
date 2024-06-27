// stores/mainSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserPayloadObject } from '../interfaces';
import { loadUser, saveUser, clearUser } from '../utils/storage';

interface MainState {
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  isFieldFocusRegistered: boolean;
}

const initialState: MainState = {
  userName: null,
  userEmail: null,
  userRole: null,
  isFieldFocusRegistered: false,
};

export const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserPayloadObject>) => {
      state.userName = action.payload.name;
      state.userEmail = action.payload.email;
      state.userRole = action.payload.role;
      saveUser(action.payload); // localStorage에 저장
    },
    initializeUser: (state) => {
      const user = loadUser(); // localStorage에서 불러오기
      if (user) {
        state.userName = user.name;
        state.userEmail = user.email;
        state.userRole = user.role;
      }
    },
    clearUserState: (state) => {
      state.userName = null;
      state.userEmail = null;
      state.userRole = null;
      clearUser(); // localStorage에서 제거
    },
  },
});

export const { setUser, initializeUser, clearUserState } = mainSlice.actions;
export default mainSlice.reducer;
