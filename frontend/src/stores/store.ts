// stores/store.ts
import { configureStore } from '@reduxjs/toolkit'
import darkModeReducer from './darkModeSlice'
import mainReducer from './mainSlice'
import { useMemo } from 'react'

let store

const initStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      darkMode: darkModeReducer,
      main: mainReducer,
    },
    preloadedState,
  })
}

export const initializeStore = (preloadedState) => {
  let _store = store ?? initStore(preloadedState)

  if (preloadedState && store) {
    _store = initStore({
      ...store.getState(),
      ...preloadedState,
    })
    store = undefined
  }

  if (typeof window === 'undefined') return _store
  if (!store) store = _store

  return _store
}

export const useStore = (initialState) => {
  return useMemo(() => initializeStore(initialState), [initialState])
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {darkMode: DarkModeState, main: MainState}
export type AppDispatch = typeof store.dispatch
