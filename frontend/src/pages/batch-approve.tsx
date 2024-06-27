import { mdiServer } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';

interface Task {
  task_id: string;
  agent_id: string;
  hostname: string;
  input: string;
  script_code: string;
}

const BatchApprovePage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{ action: 'approve' | 'reject', visible: boolean }>({ action: 'approve', visible: false });

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

  const handleConfirmApprove = () => {
    setShowConfirmModal({ action: 'approve', visible: true });
  };

  const handleConfirmReject = () => {
    setShowConfirmModal({ action: 'reject', visible: true });
  };

  const handleConfirmAction = () => {
    if (showConfirmModal.action === 'approve') {
      handleApprove();
    } else {
      handleReject();
    }
    setShowConfirmModal({ action: 'approve', visible: false });
  };

  const handleCancelAction = () => {
    setShowConfirmModal({ action: 'approve', visible: false });
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Batch Approve Tasks')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiServer} title="Batch Approve Tasks" main />

        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <>
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
                      <td className="py-2 px-4 border" style={{ whiteSpace: 'pre-wrap' }}>{task.script_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded mr-2"
                onClick={handleConfirmApprove}
                disabled={selectedTasks.length === 0}
              >
                Approve Selected
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleConfirmReject}
                disabled={selectedTasks.length === 0}
              >
                Reject Selected
              </button>
            </div>
          </>
        )}
      </SectionMain>

      {showConfirmModal.visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Confirm Action</h2>
            <p className="mb-4">Are you sure you want to {showConfirmModal.action === 'approve' ? 'approve' : 'reject'} the selected tasks?</p>
            <div className="flex justify-end">
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
                onClick={handleCancelAction}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleConfirmAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

BatchApprovePage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default BatchApprovePage;
