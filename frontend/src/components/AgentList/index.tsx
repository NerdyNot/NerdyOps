import React, { useState, useEffect } from 'react';
import { Agent } from '../../interfaces'; // 에이전트 타입 정의 파일
import { useRouter } from 'next/router';
import CardBoxModal from '../CardBox/Modal';
import Button from '../Button';
import { mdiCog } from '@mdi/js';
import Icon from '../Icon';

interface Props {
  agents: Agent[];
  onActionClick: (agent: Agent) => void;
  onDeleteClick: (agent: Agent) => void;
  onBulkActionClick: (selectedAgents: Agent[]) => void; // 일괄 작업을 위한 함수
}

const AgentList: React.FC<Props> = ({ agents, onActionClick, onDeleteClick, onBulkActionClick }) => {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalActive, setIsModalActive] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]); // 선택된 에이전트들
  const [selectAll, setSelectAll] = useState<boolean>(false); // 전체 선택 상태

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

  const handleCheckboxChange = (agent: Agent) => {
    setSelectedAgents(prevSelected => {
      if (prevSelected.includes(agent)) {
        return prevSelected.filter(a => a.agent_id !== agent.agent_id);
      } else {
        return [...prevSelected, agent];
      }
    });
  };

  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedAgents([]);
    } else {
      setSelectedAgents(agents);
    }
    setSelectAll(!selectAll);
  };

  useEffect(() => {
    setSelectAll(selectedAgents.length === agents.length);
  }, [selectedAgents, agents.length]);

  const handleBulkActionClick = () => {
    onBulkActionClick(selectedAgents);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-4">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllChange}
              />
            </th> {/* 체크박스 열 추가 */}
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
              <td className="py-2 px-4 border">
                <input
                  type="checkbox"
                  checked={selectedAgents.includes(agent)}
                  onChange={() => handleCheckboxChange(agent)}
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
      {/* 일괄 작업 버튼 추가 */}
      {selectedAgents.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleBulkActionClick}
          >
            Action to Selected Agents
          </button>
        </div>
      )}
    </div>
  );
};

export default AgentList;
