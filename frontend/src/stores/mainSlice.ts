// stores/mainSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UserPayloadObject } from '../interfaces'
import { loadUser } from '../utils/storage'

interface MainState {
  userName: string | null
  userEmail: string | null
  userRole: string | null
  isFieldFocusRegistered: boolean
}

const initialState: MainState = {
  userName: null,
  userEmail: null,
  userRole: null,
  isFieldFocusRegistered: false,
}

export const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserPayloadObject>) => {
      state.userName = action.payload.name
      state.userEmail = action.payload.email
      state.userRole = action.payload.role
    },
    initializeUser: (state) => {
      const user = loadUser()
      if (user) {
        state.userName = user.name
        state.userEmail = user.email
        state.userRole = user.role
      }
    },
  },
})

export const { setUser, initializeUser } = mainSlice.actions
export default mainSlice.reducer
