import Head from 'next/head';
import { mdiCheckboxMarkedCircleAutoOutline } from '@mdi/js';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import TableTasks from '../components/Table/TableTasks';
import useAgents from '../hooks/useAgents';
import { getPageTitle } from '../config';

interface Task {
  task_id: string;
  input: string;
  command: string;
  script_code: string;
  output: string;
  interpretation: string;
}

const AgentTasksPage = () => {
  const router = useRouter();
  const { agent_id } = router.query; // URL 파라미터에서 agent_id를 가져옴
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const { agents, loading: agentsLoading, error: agentsError } = useAgents(centralServerUrl);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agent_id as string || '');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent_id) {
      setSelectedAgentId(agent_id as string);
      fetchTasks(agent_id as string);
    }
  }, [agent_id]);

  const fetchTasks = async (agentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${centralServerUrl}/get-agent-tasks`, {
        params: { agent_id: agentId },
      });
      setTasks(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgentId(e.target.value);
  };

  const handleFetchTasks = () => {
    if (selectedAgentId) {
      fetchTasks(selectedAgentId);
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Agent Tasks')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiCheckboxMarkedCircleAutoOutline} title="Agent Tasks" main/>

        <div className="mb-4">
          {agentsLoading && <p>Loading agents...</p>}
          {agentsError && <p className="text-red-500">{agentsError}</p>}
          {!agentsLoading && !agentsError && (
            <>
              <select
                value={selectedAgentId}
                onChange={handleAgentChange}
                className="border p-2 w-full"
              >
                <option value="">Select Agent</option>
                {agents.map((agent) => (
                  <option key={agent.agent_id} value={agent.agent_id}>
                    {agent.agent_id}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFetchTasks}
                className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
                disabled={loading || !selectedAgentId}
              >
                Fetch Tasks
              </button>
            </>
          )}
        </div>
        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {tasks.length > 0 && <TableTasks tasks={tasks} />}
      </SectionMain>
    </>
  );
};

AgentTasksPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentTasksPage;
