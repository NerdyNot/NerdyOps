import { mdiServer } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import { Task } from '../interfaces'; // Task 타입 정의 파일

const BatchResultsPage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCompletedTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${centralServerUrl}/get-all-completed-tasks`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCompletedTasks();
  }, []);

  return (
    <>
      <Head>
        <title>{getPageTitle('Batch Task Results')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiServer} title="Batch Task Results" main>
        </SectionTitleLineWithButton>

        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4">Agent ID</th>
                  <th className="py-2 px-4">Task ID</th>
                  <th className="py-2 px-4">Input</th>
                  <th className="py-2 px-4">Script Code</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {tasks.map(task => (
                  <tr key={task.task_id}>
                    <td className="py-2 px-4 border">{task.agent_id}</td>
                    <td className="py-2 px-4 border">{task.hostname}</td>
                    <td className="py-2 px-4 border">{task.input}</td>
                    <td className="py-2 px-4 border" style={{ whiteSpace: 'pre-wrap' }}>{task.script_code}</td>
                    <td className="py-2 px-4 border" style={{ whiteSpace: 'pre-wrap' }}>{task.output}</td>
                    <td className="py-2 px-4 border">{task.error}</td>
                    <td className="py-2 px-4 border" style={{ whiteSpace: 'pre-wrap' }}>{task.interpretation}</td>
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

BatchResultsPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default BatchResultsPage;
