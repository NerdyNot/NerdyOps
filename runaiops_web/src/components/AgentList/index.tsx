import React from 'react';
import { Agent } from '../../interfaces'; // 에이전트 타입 정의 파일
import { useRouter } from 'next/router';

interface Props {
  agents: Agent[];
  onActionClick: (agent: Agent) => void;
}

const AgentList: React.FC<Props> = ({ agents, onActionClick }) => {
  const router = useRouter();

  const handleTaskListClick = (agentId: string) => {
    router.push(`/agent-tasks?agent_id=${agentId}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">Hostname</th>
            <th className="py-2 px-4">OS</th>
            <th className="py-2 px-4">Private IP</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {agents.map(agent => (
            <tr key={agent.agent_id}>
              <td className="py-2 px-4 border">{agent.agent_id}</td>
              <td className="py-2 px-4 border">{agent.computer_name}</td>
              <td className="py-2 px-4 border">{agent.os_type}</td>
              <td className="py-2 px-4 border">{agent.private_ip}</td>
              <td className="py-2 px-4 border">{agent.status}</td>
              <td className="py-2 px-4 border">
                <div className="flex space-x-2">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => onActionClick(agent)}
                  >
                    Action
                  </button>
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={() => handleTaskListClick(agent.agent_id)}
                  >
                    Task List
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AgentList;
