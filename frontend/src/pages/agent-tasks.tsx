import Head from 'next/head';
import { mdiCheckboxMarkedCircleAutoOutline } from '@mdi/js';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import useAgents from '../hooks/useAgents';
import { getPageTitle } from '../config';
import Modal from '../components/Modal';
import ReactMarkdown from 'react-markdown';
import TaskSubmitModal from '../components/TaskSubmitModal';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // CommonJS 스타일로 import
import { useBackendUrl } from '../contexts/BackendUrlContext';
import { useAppSelector } from '../stores/hooks';

interface Task {
  task_id: string;
  input: string;
  script_code: string;
  output: string;
  interpretation: string;
  status: string;
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  submitted_by: string;
}


const AgentTasksPage = () => {
  const router = useRouter();
  const { agent_id } = router.query;
  const { backendUrl } = useBackendUrl();
  const { agents, loading: agentsLoading, error: agentsError } = useAgents(backendUrl);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agent_id as string || '');
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalActive, setIsModalActive] = useState<boolean>(false);
  const [isTaskSubmitModalActive, setIsTaskSubmitModalActive] = useState<boolean>(false);
  const userName = useAppSelector((state) => state.main.userName);

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
      const [pendingResponse, completedResponse] = await Promise.all([
        axios.get(`${backendUrl}/get-pending-tasks`, {
          params: { agent_id: agentId },
        }),
        axios.get(`${backendUrl}/get-agent-tasks`, {
          params: { agent_id: agentId },
        }),
      ]);
      console.log('Fetched pending tasks:', pendingResponse.data);
      console.log('Fetched completed tasks:', completedResponse.data);
      setPendingTasks(pendingResponse.data);
      setCompletedTasks(completedResponse.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
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

  const handleApprove = async (task_id: string) => {
    try {
      await axios.post(`${backendUrl}/approve-task`, { task_id, username: userName });
      fetchTasks(selectedAgentId); // Refresh tasks after approval
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleReject = async (task_id: string) => {
    try {
      await axios.post(`${backendUrl}/reject-task`, { task_id, username: userName });
      fetchTasks(selectedAgentId); // Refresh tasks after rejection
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsModalActive(true);
  };

  const handleModalClose = () => {
    setIsModalActive(false);
    setSelectedTask(null);
  };

  const handleTaskSubmitModalClose = () => {
    setIsTaskSubmitModalActive(false);
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Agent Tasks')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiCheckboxMarkedCircleAutoOutline} title="Agent Tasks" main />

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
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleFetchTasks}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={loading || !selectedAgentId}
                >
                  Fetch Tasks
                </button>
                <button
                  onClick={() => setIsTaskSubmitModalActive(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  disabled={loading || !selectedAgentId}
                >
                  Add Task
                </button>
              </div>
            </>
          )}
        </div>
        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {pendingTasks.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4">Pending Tasks</h2>
            <div className="mb-8">
              {pendingTasks.map((task) => (
                <div key={task.task_id} className="mb-4 p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Task ID: {task.task_id}</h3>
                  <div className="mb-2">
                    <strong>Submitted By:</strong>
                    <p className="p-2 bg-white rounded">{task.submitted_by}</p> {/* Submitted By 표시 */}
                  </div>
                  <div className="mb-2">
                    <strong>Submitted At:</strong>
                    <p className="p-2 bg-white rounded">{new Date(task.submitted_at).toLocaleString()}</p>
                  </div>
                  <div className="mb-2">
                    <strong>Input:</strong>
                    <p className="p-2 bg-white rounded">{task.input}</p>
                  </div>
                  <div className="mb-2">
                    <strong>Script Code:</strong>
                    <div className="p-2 bg-white rounded" style={{ whiteSpace: 'pre-wrap' }}>
                      <SyntaxHighlighter language="bash" style={atomDark}>
                        {task.script_code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleApprove(task.task_id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(task.task_id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      {completedTasks.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Completed Tasks</h2>
          <div>
            {completedTasks.map((task) => (
              <div key={task.task_id} className="mb-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Task ID: {task.task_id}</h3>
                <div className="mb-2">
                  <strong>Submitted By:</strong>
                  <p className="p-2 bg-white rounded">{task.submitted_by}</p> {/* Submitted By 표시 */}
                </div>
                <div className="mb-2">
                  <strong>Submitted At:</strong>
                  <p className="p-2 bg-white rounded">{new Date(task.submitted_at).toLocaleString()}</p>
                </div>
                <div className="mb-2">
                  <strong>Approved At:</strong>
                  <p className="p-2 bg-white rounded">{new Date(task.approved_at).toLocaleString()}</p>
                </div>
                <div className="mb-2">
                  <strong>Input:</strong>
                  <p className="p-2 bg-white rounded">{task.input}</p>
                </div>
                <div className="mb-2">
                  <strong>Script Code:</strong>
                  <div className="p-2 bg-white rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    <SyntaxHighlighter language="bash" style={atomDark}>
                      {task.script_code}
                    </SyntaxHighlighter>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleViewDetails(task)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </SectionMain>

      {isModalActive && (
        <Modal onClose={handleModalClose}>
          <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-3xl mx-auto my-15 overflow-auto" style={{ maxHeight: '80vh' }}>
            {selectedTask && (
              <>
                <h2 className="text-2xl font-semibold mb-4">Task Details</h2>
                <div className="mb-2">
                  <strong>Task ID:</strong>
                  <p className="p-2 bg-gray-100 rounded">{selectedTask.task_id}</p>
                </div>
                <div className="mb-2">
                  <strong>Submitted At:</strong>
                  <p className="p-2 bg-gray-100 rounded">{new Date(selectedTask.submitted_at).toLocaleString()}</p>
                </div>
                {selectedTask.approved_at && (
                  <div className="mb-2">
                    <strong>Approved At:</strong>
                    <p className="p-2 bg-gray-100 rounded">{new Date(selectedTask.approved_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedTask.rejected_at && (
                  <div className="mb-2">
                    <strong>Rejected At:</strong>
                    <p className="p-2 bg-gray-100 rounded">{new Date(selectedTask.rejected_at).toLocaleString()}</p>
                  </div>
                )}
                <div className="mb-2">
                  <strong>Input:</strong>
                  <p className="p-2 bg-gray-100 rounded">{selectedTask.input}</p>
                </div>
                <div className="mb-2">
                  <strong>Script Code:</strong>
                  <div className="p-2 bg-gray-100 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    <SyntaxHighlighter language="bash" style={atomDark}>
                      {selectedTask.script_code}
                    </SyntaxHighlighter>
                  </div>
                </div>
                <div className="mb-2">
                  <strong>Output:</strong>
                  <p className="p-2 bg-gray-100 rounded">{selectedTask.output}</p>
                </div>
                <div className="mb-2">
                  <strong>Interpretation:</strong>
                  <div className="p-2 bg-gray-100 rounded">
                    <ReactMarkdown>{selectedTask.interpretation}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleModalClose}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {isTaskSubmitModalActive && (
        <TaskSubmitModal
          agent={agents.find((agent) => agent.agent_id === selectedAgentId) || null}
          onClose={handleTaskSubmitModalClose}
        />
      )}
    </>
  );
};

AgentTasksPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentTasksPage;
