import axios from 'axios';
import {
  mdiChartTimelineVariant,
  mdiServer,
  mdiAlertCircle,
  mdiCheckBold,
  mdiGithub,
} from '@mdi/js';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import Button from '../components/Button';
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
      const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('token='));
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const tokenValue = token.split('=')[1];
        const verifyResponse = await axios.post(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/verify-token`, { token: tokenValue });

        if (verifyResponse.status !== 200) {
          router.push('/login');
          return;
        }

        const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/user-info`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`,
          },
        });

        const agentResponse = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/get-agents`);
        const tasksResponse = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/get-tasks-summary`);
        const { successCount, failureCount } = tasksResponse.data;

        setUserState(userResponse.data);
        setAgentCount(agentResponse.data.length);
        setSuccessTaskCount(successCount);
        setFailureTaskCount(failureCount);

        dispatch(setUser(userResponse.data));
      } catch (error) {
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
  );
}

IndexPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default IndexPage;
