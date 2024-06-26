import React, { useState, useEffect } from 'react';
import { Agent } from '../../interfaces';
import { useRouter } from 'next/router';
import CardBoxModal from '../CardBox/Modal';
import Button from '../Button';
import { mdiCog } from '@mdi/js';
import Icon from '../Icon';

interface Props {
  agents: Agent[];
  onActionClick: (agent: Agent) => void;
  onDeleteClick: (agent: Agent) => void;
  onSelectAgents: (selectedAgents: string[]) => void; // 새로운 prop 추가
}

const AgentList: React.FC<Props> = ({ agents, onActionClick, onDeleteClick, onSelectAgents }) => {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalActive, setIsModalActive] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  useEffect(() => {
    onSelectAgents(selectedAgents); // 선택된 에이전트를 상위 컴포넌트로 전달
  }, [selectedAgents]);

  const handleTaskListClick = (agentId: string) => {
    router.push(`/agent-tasks?agent_id=${agentId}`);
  };

  const handleSettingsClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalActive(true);
  };

  const handleModalClose = () => {
    setIsModalActive(false);
    setSelectedAgent(null);
  };

  const handleDeleteClickWrapper = () => {
    if (selectedAgent) {
      onDeleteClick(selectedAgent);
      handleModalClose();
    }
  };

  const handleCheckboxChange = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-4">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAgents(agents.map((agent) => agent.agent_id));
                  } else {
                    setSelectedAgents([]);
                  }
                }}
                checked={selectedAgents.length === agents.length}
              />
            </th>
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">Hostname</th>
            <th className="py-2 px-4">OS</th>
            <th className="py-2 px-4">Private IP</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {agents.map((agent) => (
            <tr key={agent.agent_id}>
              <td className="py-2 px-4 border">
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent.agent_id)}
                  onChange={() => handleCheckboxChange(agent.agent_id)}
                />
              </td>
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
                  <button
                    className="text-gray-500 p-2 rounded-full"
                    onClick={() => handleSettingsClick(agent)}
                  >
                    <Icon path={mdiCog} size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedAgent && (
        <CardBoxModal
          title="Agent Settings"
          buttonColor="danger"
          buttonLabel="Delete"
          isActive={isModalActive}
          onConfirm={handleDeleteClickWrapper}
          onCancel={handleModalClose}
        >
          <p>Are you sure you want to delete agent {selectedAgent.agent_id}?</p>
        </CardBoxModal>
      )}
    </div>
  );
};

export default AgentList;
