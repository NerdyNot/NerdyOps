import React from 'react';
import { Agent } from '../../interfaces';
import Button from '../Button';
import { mdiConsole } from '@mdi/js';

interface TerminalAgentListProps {
  agents: Agent[];
  onConnectClick: (agent: Agent) => void;
}

const TerminalAgentList: React.FC<TerminalAgentListProps> = ({ agents, onConnectClick }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">Hostname</th>
            <th className="py-2 px-4">OS</th>
            <th className="py-2 px-4">Private IP</th>
            <th className="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {agents
            .filter(agent => !/windows/i.test(agent.os_type))
            .map(agent => (
              <tr key={agent.agent_id}>
                <td className="py-2 px-4 border">{agent.agent_id}</td>
                <td className="py-2 px-4 border">{agent.computer_name}</td>
                <td className="py-2 px-4 border">{agent.os_type}</td>
                <td className="py-2 px-4 border">{agent.private_ip}</td>
                <td className="py-2 px-4 border">
                  <Button color="info" onClick={() => onConnectClick(agent)} label="Connect" icon={mdiConsole} />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TerminalAgentList;
