import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../Modal';
import { Agent } from '../../interfaces';
import { useAppSelector } from '../../stores/hooks';

interface Props {
  agent: Agent | null;
  agents?: Agent[]; // 여러 에이전트를 위한 추가 필드
  onClose: () => void;
}

const TaskSubmitModal: React.FC<Props> = ({ agent, agents, onClose }) => {
  const [command, setCommand] = useState<string>('');
  const [taskResult, setTaskResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const userName = useAppSelector((state) => state.main.userName); // userName 가져오기
  
  const handleSubmit = async () => {
    if (!userName) return;
  
    setLoading(true);
    setError(null);
    try {
      if (agent) {
        // 단일 에이전트에 대한 작업 제출
        const response = await axios.post(`/api/submit-task`, {
          command,
          agent_id: agent.agent_id,
          username: userName, // username 추가
        });
        setTaskResult(response.data);
      } else if (agents && agents.length > 0) {
        // 여러 에이전트에 대한 작업 제출
        const responses = await Promise.all(
          agents.map(a => axios.post(`/api/submit-task`, {
            command,
            agent_id: a.agent_id,
            username: userName, // username 추가
          }))
        );
        setTaskResult(responses.map(res => res.data));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Modal onClose={onClose}>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-2">
          Submit Task {agent ? `for ${agent.agent_id}` : 'for Selected Agents'}
        </h2>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter your command"
          className="border p-3 w-full rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className="flex justify-end">
          {taskResult ? (
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
            >
              Close
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                'Submit Task'
              )}
            </button>
          )}
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {taskResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="text-xl font-semibold mb-2">Task Result</h3>
            <div className="bg-white p-4 rounded-md shadow">
              {Array.isArray(taskResult) ? (
                taskResult.map((result, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Status:</span>
                      <span>{result.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Task ID:</span>
                      <span>{result.task_id}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Status:</span>
                    <span>{taskResult.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Task ID:</span>
                    <span>{taskResult.task_id}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TaskSubmitModal;
