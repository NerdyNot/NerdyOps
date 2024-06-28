import axios from 'axios'
import {
  mdiChartTimelineVariant,
  mdiServer,
  mdiAlertCircle,
  mdiCheckBold,
  mdiGithub,
} from '@mdi/js'
import Head from 'next/head'
import React, { useEffect } from 'react'
import type { ReactElement } from 'react'
import Button from '../components/Button'
import LayoutAuthenticated from '../layouts/Authenticated'
import SectionMain from '../components/Section/Main'
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton'
import CardBoxWidget from '../components/CardBox/Widget'
import { getPageTitle } from '../config'
import { GetServerSideProps } from 'next'
import { useDispatch } from 'react-redux'
import { setUser } from '../stores/mainSlice'

const IndexPage = ({ user, agentCount, successTaskCount, failureTaskCount }: { user: { name: string, email: string, role: string }, agentCount: number, successTaskCount: number, failureTaskCount: number }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    if (user) {
      dispatch(setUser(user))
    }
  }, [user, dispatch])

  return (
    <>
      <Head>
        <title>{getPageTitle('Index')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChartTimelineVariant} title="Overview" main>
          <Button
            href="https://github.com/NerdyNot/NerdyOps"
            target="_blank"
            icon={mdiGithub}
            label="Star on GitHub"
            color="contrast"
            roundedFull
            small
          />
        </SectionTitleLineWithButton>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
          <CardBoxWidget
            trendLabel=""
            trendType=""
            trendColor="success"
            icon={mdiServer}
            iconColor="success"
            number={agentCount}
            label="Agents"
          />
          <CardBoxWidget
            trendLabel=""
            trendType=""
            trendColor="info"
            icon={mdiCheckBold}
            iconColor="info"
            number={successTaskCount}
            label="Successful Tasks"
          />
          <CardBoxWidget
            trendLabel=""
            trendType=""
            trendColor="danger"
            icon={mdiAlertCircle}
            iconColor="danger"
            number={failureTaskCount}
            label="Failed Tasks"
          />
        </div>
      </SectionMain>
    </>
  )
}

IndexPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context
  const token = req.cookies.token || ''

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  try {
    const verifyResponse = await axios.post(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/verify-token`, { token })

    if (verifyResponse.status !== 200) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      }
    }

    const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/user-info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const agentResponse = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/get-agents`)
    const agents = agentResponse.data
    const tasksResponse = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/get-tasks-summary`)
    const { successCount, failureCount } = tasksResponse.data

    return {
      props: {
        user: userResponse.data,
        agentCount: agents.length,
        successTaskCount: successCount,
        failureTaskCount: failureCount,
      },
    }
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }
}

export default IndexPage
