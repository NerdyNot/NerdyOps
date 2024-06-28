import React, { useEffect } from 'react'
import type { AppProps } from 'next/app'
import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { Provider } from 'react-redux'
import { useStore } from '../stores/store'
import '../css/main.css'
import { AuthProvider } from '../contexts/AuthContext'
import requireAuth from '../utils/requireAuth'
import { initializeUser } from '../stores/mainSlice'

export type NextPageWithLayout<P = Record<string, unknown>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const skipAuthPages = ['/login']

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const store = useStore(pageProps.initialReduxState)
  const getLayout = Component.getLayout || ((page) => page)
  const AuthenticatedComponent = requireAuth(Component, skipAuthPages)

  useEffect(() => {
    store.dispatch(initializeUser())
  }, [store])

  return (
    <Provider store={store}>
      <AuthProvider>
        {getLayout(
          <>
            <Head>
              <link rel="icon" href="/images/favicon.ico" />
              <title>NerdyOps</title>
            </Head>
            <AuthenticatedComponent {...pageProps} />
          </>
        )}
      </AuthProvider>
    </Provider>
  )
}

export default MyApp
