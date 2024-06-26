import React, { useEffect } from 'react'
import Script from 'next/script'
import type { AppProps } from 'next/app'
import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { store } from '../stores/store'
import { Provider, useDispatch } from 'react-redux'
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
  const getLayout = Component.getLayout || ((page) => page)
  const AuthenticatedComponent = requireAuth(Component, skipAuthPages)

  useEffect(() => {
    store.dispatch(initializeUser())
  }, [])

  const title = `RunAIOps`
  const description = 'NerdyNot - RunAIOps'
  const url = 'https://github.com/NerdyNot/'
  const image = `https://static.justboil.me/templates/one/repo-tailwind-react.png`
  const imageWidth = '1920'
  const imageHeight = '960'

  return (
    <Provider store={store}>
      <AuthProvider>
        {getLayout(
          <>
            <Head>
              <meta name="description" content={description} />
              <meta property="og:url" content={url} />
              <meta property="og:site_name" content="JustBoil.me" />
              <meta property="og:title" content={title} />
              <meta property="og:description" content={description} />
              <meta property="og:image" content={image} />
              <meta property="og:image:type" content="image/png" />
              <meta property="og:image:width" content={imageWidth} />
              <meta property="og:image:height" content={imageHeight} />
              <meta property="twitter:card" content="summary_large_image" />
              <meta property="twitter:title" content={title} />
              <meta property="twitter:description" content={description} />
              <meta property="twitter:image:src" content={image} />
              <meta property="twitter:image:width" content={imageWidth} />
              <meta property="twitter:image:height" content={imageHeight} />
              <link rel="icon" href="/admin-one-react-tailwind/favicon.png" />
            </Head>
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=UA-130795909-1"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'UA-130795909-1');
              `}
            </Script>
            <AuthenticatedComponent {...pageProps} />
          </>
        )}
      </AuthProvider>
    </Provider>
  )
}

export default MyApp
