import { supabaseClient } from '@supabase/supabase-auth-helpers/nextjs'
import { UserProvider } from '@supabase/supabase-auth-helpers/react'
import { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'styles/global.css'

import Layout from 'components/Layout'

import { UserInfoContextProvider } from 'hooks/useUserInfo'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <UserProvider supabaseClient={supabaseClient}>
        <UserInfoContextProvider>
          <Layout>
            <Component {...pageProps} />
            <ToastContainer
              autoClose={false}
              draggable={false}
              newestOnTop={false}
              position="bottom-right"
              rtl={false}
              theme="dark"
              closeOnClick
              pauseOnFocusLoss
            />
          </Layout>
        </UserInfoContextProvider>
      </UserProvider>
    </>
  )
}