import { mdiServer } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
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
import { useDispatch } from 'react-redux';
import { initializeUser } from '../stores/mainSlice';
import { useBackendUrl } from '../contexts/BackendUrlContext';

const AgentsPage = () => {
  const dispatch = useDispatch();
  const { backendUrl } = useBackendUrl();

  useEffect(() => {
    dispatch(initializeUser());
  }, [dispatch]);

  const { agents, loading, error, mutate } = useAgents(backendUrl); // mutate 함수 추가
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgentsForBulkAction, setSelectedAgentsForBulkAction] = useState<Agent[]>([]); // 일괄 작업을 위한 상태 추가

  const handleActionClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleCloseModal = () => {
    setSelectedAgent(null);
  };

  const handleBulkActionClick = (selectedAgents: Agent[]) => {
    setSelectedAgentsForBulkAction(selectedAgents);
  };

  const handleDeleteClick = async (agent: Agent) => {
    try {
      await axios.post(`${backendUrl}/delete-agent`, { agent_id: agent.agent_id });
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
            <AgentList
              agents={agents}
              onActionClick={handleActionClick}
              onDeleteClick={handleDeleteClick}
              onBulkActionClick={handleBulkActionClick} // 일괄 작업 함수 추가
            />
          </CardBox>
        )}
        {selectedAgent && (
          <TaskSubmitModal agent={selectedAgent} onClose={handleCloseModal} />
        )}
        {selectedAgentsForBulkAction.length > 0 && (
          <TaskSubmitModal agent={null} onClose={() => setSelectedAgentsForBulkAction([])} agents={selectedAgentsForBulkAction} /> // 일괄 작업을 위한 모달 추가
        )}
      </SectionMain>
    </>
  );
};

AgentsPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentsPage;
