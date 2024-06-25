import React, { useState } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { Agent } from '../../interfaces';

interface Props {
  agent: Agent | null;
  onClose: () => void;
}

const TaskSubmitModal: React.FC<Props> = ({ agent, onClose }) => {
  const [command, setCommand] = useState<string>('');
  const [taskResult, setTaskResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (agent) {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/submit-task`, {
          command,
          agent_id: agent.agent_id,
        });
        setTaskResult(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <h2>Submit Task for Agent {agent?.agent_id}</h2>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter your command"
          className="border p-2 w-full"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
          disabled={loading}
        >
          Submit Task
        </button>
        {loading && <p>Submitting task...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {taskResult && (
          <div className="mt-4">
            <h3>Task Result</h3>
            <pre>{JSON.stringify(taskResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskSubmitModal;
