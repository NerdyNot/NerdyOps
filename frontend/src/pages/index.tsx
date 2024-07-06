import axios from 'axios';
import {
  mdiChartTimelineVariant,
  mdiServer,
  mdiAlertCircle,
  mdiCheckBold,
} from '@mdi/js';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import CardBoxWidget from '../components/CardBox/Widget';
import { getPageTitle } from '../config';
import { useDispatch } from 'react-redux';
import { setUser } from '../stores/mainSlice';
import { useRouter } from 'next/router';

const IndexPage = () => {
  const [user, setUserState] = useState<{ name: string; email: string; role: string } | null>(null);
  const [agentCount, setAgentCount] = useState(0);
  const [successTaskCount, setSuccessTaskCount] = useState(0);
  const [failureTaskCount, setFailureTaskCount] = useState(0);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const tokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('token='));
      if (!tokenCookie) {
        router.push('/login');
        return;
      }

      const token = tokenCookie.split('=')[1];

      try {
        const verifyResponse = await axios.post('/api/verify-token', { token });

        if (verifyResponse.status !== 200) {
          throw new Error('Token verification failed');
        }

        const userResponse = await axios.get('/api/user-info', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const agentResponse = await axios.get('/api/get-agents');
        const tasksResponse = await axios.get('/api/get-tasks-summary');
        const { successCount, failureCount } = tasksResponse.data;

        setUserState(userResponse.data);
        setAgentCount(agentResponse.data.length);
        setSuccessTaskCount(successCount);
        setFailureTaskCount(failureCount);

        dispatch(setUser(userResponse.data));
      } catch (error) {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
      }
    };

    fetchData();
  }, [dispatch, router]);

  return (
    <>
      <Head>
        <title>{getPageTitle('Index')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChartTimelineVariant} title="Overview" main>
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
  );
};

IndexPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default IndexPage;
