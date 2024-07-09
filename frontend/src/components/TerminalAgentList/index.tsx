import React from 'react';
import { Agent } from '../../interfaces';
import Button from '../Button';

interface TerminalAgentListProps {
  agents: Agent[];
  onConnectClick: (agent: Agent) => void;
}

const TerminalAgentList: React.FC<TerminalAgentListProps> = ({ agents, onConnectClick }) => {
  return (
    <table className="min-w-full leading-normal">
      <thead>
        <tr>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Name
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Private IP
          </th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
        </tr>
      </thead>
      <tbody>
        {agents.map(agent => (
          <tr key={agent.agent_id}>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
              {agent.name}
            </td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
              {agent.private_ip}
            </td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
              <Button onClick={() => onConnectClick(agent)} label="Connect" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TerminalAgentList;
