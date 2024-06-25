import axios from 'axios';
import {
  mdiChartTimelineVariant,
  mdiAccountMultiple,
  mdiServer,
  mdiAlertCircle,
  mdiCheckBold,
  mdiGithub,
} from '@mdi/js';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import Button from '../components/Button';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import CardBoxWidget from '../components/CardBox/Widget';
import CardBox from '../components/CardBox';
import { getPageTitle } from '../config';

const DashboardPage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;

  const [agentCount, setAgentCount] = useState<number>(0);
  const [successTaskCount, setSuccessTaskCount] = useState<number>(0);
  const [failureTaskCount, setFailureTaskCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const agentResponse = await axios.get(`${centralServerUrl}/get-agents`);
        const agents = agentResponse.data;
        setAgentCount(agents.length);
        console.log('Agents data:', agents);
        console.log('Agent Count Updated:', agents.length);

        const tasksResponse = await axios.get(`${centralServerUrl}/get-tasks-summary`);
        const { successCount, failureCount } = tasksResponse.data;
        setSuccessTaskCount(successCount);
        setFailureTaskCount(failureCount);
        console.log('Tasks summary data:', tasksResponse.data);
        console.log('Success Task Count Updated:', successCount);
        console.log('Failure Task Count Updated:', failureCount);
      } catch (err) {
        console.error('Error fetching data:', err);  // 오류 로그 추가
        setError(err.response?.data?.error || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [centralServerUrl]);

  useEffect(() => {
    console.log('Agent Count:', agentCount);
    console.log('Success Task Count:', successTaskCount);
    console.log('Failure Task Count:', failureTaskCount);
  }, [agentCount, successTaskCount, failureTaskCount]);

  return (
    <>
      <Head>
        <title>{getPageTitle('Index')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChartTimelineVariant} title="Overview" main>
          <Button
            href="https://github.com/justboil/admin-one-react-tailwind"
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
            number={loading ? '...' : agentCount}
            label="Agents"
          />
          <CardBoxWidget
            trendLabel=""
            trendType=""
            trendColor="info"
            icon={mdiCheckBold}
            iconColor="info"
            number={loading ? '...' : successTaskCount}
            label="Successful Tasks"
          />
          <CardBoxWidget
            trendLabel=""
            trendType=""
            trendColor="danger"
            icon={mdiAlertCircle}
            iconColor="danger"
            number={loading ? '...' : failureTaskCount}
            label="Failed Tasks"
          />
        </div>
        
        {error && <p className="text-red-500">{error}</p>}

      </SectionMain>
    </>
  );
};

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default DashboardPage;
