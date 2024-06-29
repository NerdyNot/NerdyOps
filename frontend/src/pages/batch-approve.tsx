import { mdiServer } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import { Task } from '../interfaces'; // Task 타입 정의 파일
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const BatchApprovePage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPendingTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${centralServerUrl}/get-all-pending-tasks`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPendingTasks();
  }, []);

  const handleApprove = async () => {
    try {
      await Promise.all(
        selectedTasks.map(task_id => axios.post(`${centralServerUrl}/approve-task`, { task_id }))
      );
      fetchAllPendingTasks(); // Refresh tasks after approval
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleReject = async () => {
    try {
      await Promise.all(
        selectedTasks.map(task_id => axios.post(`${centralServerUrl}/reject-task`, { task_id }))
      );
      fetchAllPendingTasks(); // Refresh tasks after rejection
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleSelectTask = (task_id: string) => {
    setSelectedTasks(prevSelected =>
      prevSelected.includes(task_id)
        ? prevSelected.filter(id => id !== task_id)
        : [...prevSelected, task_id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.task_id));
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Batch Approve Tasks')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiServer} title="Batch Approve Tasks" main>
          <div className="flex space-x-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleApprove}
              disabled={selectedTasks.length === 0}
            >
              Approve Selected
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={handleReject}
              disabled={selectedTasks.length === 0}
            >
              Reject Selected
            </button>
          </div>
        </SectionTitleLineWithButton>

        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4">
                    <input
                      type="checkbox"
                      checked={selectedTasks.length === tasks.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="py-2 px-4">Agent ID</th>
                  <th className="py-2 px-4">Hostname</th>
                  <th className="py-2 px-4">Input</th>
                  <th className="py-2 px-4">Script Code</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {tasks.map(task => (
                  <tr key={task.task_id}>
                    <td className="py-2 px-4 border">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.task_id)}
                        onChange={() => handleSelectTask(task.task_id)}
                      />
                    </td>
                    <td className="py-2 px-4 border">{task.agent_id}</td>
                    <td className="py-2 px-4 border">{task.hostname}</td>
                    <td className="py-2 px-4 border">{task.input}</td>
                    <td className="py-2 px-4 border" style={{ whiteSpace: 'pre-wrap' }}>
                      <SyntaxHighlighter language="bash" style={atomDark}>
                        {task.script_code}
                      </SyntaxHighlighter>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionMain>
    </>
  );
};

BatchApprovePage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default BatchApprovePage;
