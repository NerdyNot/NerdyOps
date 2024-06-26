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
import { Agent } from '../interfaces';

const AgentsPage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const { agents, loading, error, mutate } = useAgents(centralServerUrl);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]); // 에이전트 ID 배열로 변경

  const handleActionClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleCloseModal = () => {
    setSelectedAgent(null);
  };

  const handleDeleteClick = async (agent: Agent) => {
    try {
      await axios.post(`${centralServerUrl}/delete-agent`, { agent_id: agent.agent_id });
      mutate();
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent.');
    }
  };

  const handleBatchSubmit = () => {
    setSelectedAgent({
      agent_id: selectedAgents.join(', '),
      computer_name: 'Multiple Agents',
      os_type: '',
      private_ip: '',
      status: 'multiple',
    });
  };

  const handleBatchSubmitClose = () => {
    setSelectedAgents([]);
  };

  const handleSelectAgents = (selectedAgents: string[]) => {
    setSelectedAgents(selectedAgents);
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Agent List')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiServer} title="Agent List" main>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleBatchSubmit}
            disabled={selectedAgents.length === 0}
          >
            Action to Selected Agents
          </button>
        </SectionTitleLineWithButton>

        {loading && <p>Loading agents...</p>}
        {error && <p>Error loading agents: {error}</p>}
        {!loading && !error && (
          <CardBox className="mb-6" hasTable>
            <AgentList
              agents={agents}
              onActionClick={handleActionClick}
              onDeleteClick={handleDeleteClick}
              onSelectAgents={handleSelectAgents} // prop 추가
            />
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
