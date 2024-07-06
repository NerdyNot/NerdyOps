import { mdiViewListOutline } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import Modal from '../components/Modal';
import ReactMarkdown from 'react-markdown';
import { Task } from '../interfaces';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const BatchResultsPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task; direction: 'ascending' | 'descending' } | null>(null);
  const [filter, setFilter] = useState<string>('');

  const fetchAllCompletedTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/get-all-completed-tasks');
      setTasks(response.data);
      setFilteredTasks(response.data);
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

  const handleSort = (key: keyof Task) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setFilteredTasks([...filteredTasks].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilter(value);
    setFilteredTasks(tasks.filter(task =>
      task.agent_id.includes(value) ||
      task.task_id.includes(value) ||
      task.input.includes(value) ||
      (task.hostname && task.hostname.includes(value)) ||
      (task.submitted_by && task.submitted_by.includes(value)) || // 필터에 submitted_by 추가
      (task.approved_by && task.approved_by.includes(value)) // 필터에 approved_by 추가
    ));
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Batch Task Results')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiViewListOutline} title="Batch Task Results" main />

        <div className="mb-4">
          <input
            type="text"
            value={filter}
            onChange={handleFilterChange}
            placeholder="Filter tasks"
            className="border p-2 w-full rounded-md"
          />
        </div>

        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('agent_id')}>
                    Agent ID {sortConfig?.key === 'agent_id' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('task_id')}>
                    Task ID {sortConfig?.key === 'task_id' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('submitted_at')}>
                    Submitted At {sortConfig?.key === 'submitted_at' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('approved_at')}>
                    Approved At {sortConfig?.key === 'approved_at' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('submitted_by')}>
                    Submitted By {sortConfig?.key === 'submitted_by' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('approved_by')}>
                    Approved By {sortConfig?.key === 'approved_by' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                  </th>
                  <th className="py-2 px-4">Input</th>
                  <th className="py-2 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {filteredTasks.map(task => (
                  <tr key={task.task_id}>
                    <td className="py-2 px-4 border">{task.agent_id}</td>
                    <td className="py-2 px-4 border">{task.task_id}</td>
                    <td className="py-2 px-4 border">{new Date(task.submitted_at).toLocaleString()}</td>
                    <td className="py-2 px-4 border">{task.approved_at ? new Date(task.approved_at).toLocaleString() : 'N/A'}</td>
                    <td className="py-2 px-4 border">{task.submitted_by}</td>
                    <td className="py-2 px-4 border">{task.approved_by || 'N/A'}</td>
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
              <strong>Submitted By:</strong>
              <p className="p-2 bg-gray-100 rounded">{selectedTask.submitted_by}</p>
            </div>
            {selectedTask.approved_by && (
              <div className="mb-2">
                <strong>Approved By:</strong>
                <p className="p-2 bg-gray-100 rounded">{selectedTask.approved_by}</p>
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
              <div className="p-2 bg-gray-100 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                <SyntaxHighlighter language="bash" style={atomDark}>
                  {selectedTask.output}
                </SyntaxHighlighter>
              </div>
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
