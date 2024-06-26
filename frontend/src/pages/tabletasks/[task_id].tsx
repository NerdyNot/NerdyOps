// pages/tabletasks/[task_id].tsx
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LayoutAuthenticated from '../../layouts/Authenticated';
import type { ReactElement } from 'react';

const TaskDetailPage = () => {
  const router = useRouter();
  const { task_id } = router.query;
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task_id) {
      const fetchTaskDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/get-task/${task_id}`);
          setTaskDetails(response.data);
        } catch (err) {
          setError(err.response?.data?.error || 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchTaskDetails();
    }
  }, [task_id]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Task Details for {task_id}</h2>
      {loading && <p>Loading task details...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {taskDetails && (
        <div className="bg-gray-100 p-4 rounded-md shadow">
          <pre className="whitespace-pre-wrap">{JSON.stringify(taskDetails, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

TaskDetailPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default TaskDetailPage;
