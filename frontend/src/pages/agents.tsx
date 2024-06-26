import { mdiServer } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState } from 'react';
import axios from 'axios';
import CardBox from '../components/CardBox';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import AgentList from '../components/AgentList';
import TaskSubmitModal from '../components/TaskSubmitModal';
import { getPageTitle } from '../config';
import useAgents from '../hooks/useAgents';
import { Agent } from '../interfaces'; // 에이전트 타입 정의 파일

const AgentsPage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL; // 환경 변수 사용
  const { agents, loading, error, mutate } = useAgents(centralServerUrl); // mutate 함수 추가
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleActionClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleCloseModal = () => {
    setSelectedAgent(null);
  };

  const handleDeleteClick = async (agent: Agent) => {
    try {
      await axios.post(`${centralServerUrl}/delete-agent`, { agent_id: agent.agent_id });
      mutate(); // 데이터 갱신
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent.');
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Agent List')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiServer} title="Agent List" main>
        </SectionTitleLineWithButton>

        {loading && <p>Loading agents...</p>}
        {error && <p>Error loading agents: {error}</p>}
        {!loading && !error && (
          <CardBox className="mb-6" hasTable>
            <AgentList agents={agents} onActionClick={handleActionClick} onDeleteClick={handleDeleteClick} />
          </CardBox>
        )}
        {selectedAgent && (
          <TaskSubmitModal agent={selectedAgent} onClose={handleCloseModal} />
        )}
      </SectionMain>
    </>
  );
};

AgentsPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentsPage;
