import { mdiServer } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import Modal from '../components/Modal';
import ReactMarkdown from 'react-markdown';

interface Task {
  task_id: string;
  agent_id: string;
  hostname: string;
  submitted_at: string;
  approved_at?: string;
  input: string;
  script_code: string;
  output: string;
  error: string;
  interpretation: string;
}

const BatchResultsPage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCompletedTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${centralServerUrl}/get-all-completed-tasks`);
      setTasks(response.data.sort((a: Task, b: Task) => new Date(b.approved_at!).getTime() - new Date(a.approved_at!).getTime()));
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

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Batch Task Results')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiServer} title="Batch Task Results" main />

        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4">Agent ID</th>
                  <th className="py-2 px-4">Task ID</th>
                  <th className="py-2 px-4">Submitted At</th>
                  <th className="py-2 px-4">Approved At</th>
                  <th className="py-2 px-4">Input</th>
                  <th className="py-2 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {tasks.map(task => (
                  <tr key={task.task_id}>
                    <td className="py-2 px-4 border">{task.agent_id}</td>
                    <td className="py-2 px-4 border">{task.task_id}</td>
                    <td className="py-2 px-4 border">{new Date(task.submitted_at).toLocaleString()}</td>
                    <td className="py-2 px-4 border">{task.approved_at ? new Date(task.approved_at).toLocaleString() : 'N/A'}</td>
                    <td className="py-2 px-4 border">{task.input}</td>
                    <td className="py-2 px-4 border">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => handleViewDetails(task)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionMain>

      {selectedTask && (
        <Modal onClose={handleCloseModal}>
          <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-3xl mx-auto my-15 overflow-auto" style={{ maxHeight: '80vh' }}>
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
            <div className="mb-2">
              <strong>Input:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.input}</p>
            </div>
            <div className="mb-2">
              <strong>Script Code:</strong>
              <div className="p-2 bg-gray-100 rounded" style={{ whiteSpace: 'pre-wrap' }}>{selectedTask.script_code}</div>
            </div>
            <div className="mb-2">
              <strong>Output:</strong>
              <div className="p-2 bg-gray-100 rounded" style={{ whiteSpace: 'pre-wrap' }}>{selectedTask.output}</div>
            </div>
            <div className="mb-2">
              <strong>Error:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.error}</p>
            </div>
            <div className="mb-2">
              <strong>Interpretation:</strong>
              <div className="p-2 bg-gray-100 rounded">
                <ReactMarkdown>{selectedTask.interpretation}</ReactMarkdown>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

BatchResultsPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default BatchResultsPage;
