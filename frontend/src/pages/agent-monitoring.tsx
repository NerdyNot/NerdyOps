// pages/agent-monitoring.tsx
import { mdiChartTimelineVariant, mdiMonitor, mdiReload, mdiInformationOutline } from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useState, useEffect } from 'react';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import CardBox from '../components/CardBox';
import { getPageTitle } from '../config';
import axios from 'axios';
import ChartLineSample from '../components/ChartLineSample';
import Button from '../components/Button';
import ImdsModal from '../components/Imds';

interface Agent {
  agent_id: string;
  computer_name: string;
  private_ip: string;
}

interface ResourceUsage {
  cpu_usage: number;
  mem_usage: number;
  running_time: number;
  timestamp: number;
  imds?: string; // IMDS 값을 문자열로 받음
}

const AgentMonitoringPage: React.FC = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([]);
  const [cpuChartData, setCpuChartData] = useState<any>({ datasets: [] });
  const [memChartData, setMemChartData] = useState<any>({ datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imdsData, setImdsData] = useState<any>(null);
  const [isImdsModalOpen, setIsImdsModalOpen] = useState(false);

  useEffect(() => {
    axios.get(`${centralServerUrl}/get-agents`)
      .then(response => {
        setAgents(response.data);
      })
      .catch(error => {
        console.error('Error fetching agents:', error);
        setError('Failed to load agents');
      });
  }, [centralServerUrl]);

  useEffect(() => {
    if (selectedAgent) {
      fetchResourceUsage(selectedAgent.agent_id);
    }
  }, [selectedAgent, centralServerUrl]);

  const fetchResourceUsage = (agentId: string) => {
    setLoading(true);
    axios.get(`${centralServerUrl}/get-resource-usage?agent_id=${agentId}`)
      .then(response => {
        const data = response.data;
        setResourceUsage(data);

        const labels = data.map((item: ResourceUsage) => new Date(item.timestamp * 1000).toLocaleTimeString());
        const cpuData = data.map((item: ResourceUsage) => item.cpu_usage);
        const memData = data.map((item: ResourceUsage) => item.mem_usage);

        setCpuChartData({
          labels,
          datasets: [{
            label: 'CPU Usage',
            data: cpuData,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          }],
        });

        setMemChartData({
          labels,
          datasets: [{
            label: 'Memory Usage',
            data: memData,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: true,
          }],
        });
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching resource usage:', error);
        setError('Failed to load resource usage');
        setLoading(false);
      });
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agentId = e.target.value;
    const agent = agents.find(agent => agent.agent_id === agentId) || null;
    setSelectedAgent(agent);
  };

  const handleReload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedAgent) {
      fetchResourceUsage(selectedAgent.agent_id);
    }
  };

  const handleImdsModalOpen = (imds: string) => {
    try {
      setImdsData(JSON.parse(imds));
    } catch (error) {
      console.error('Error parsing IMDS data:', error);
      setImdsData({ error: 'Invalid IMDS data' });
    }
    setIsImdsModalOpen(true);
  };

  const secondsToHMS = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Agent Monitoring')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiChartTimelineVariant} title="Agent Monitoring" main>
          <Button icon={mdiReload} color="whiteDark" onClick={handleReload} />
        </SectionTitleLineWithButton>

        <div className="mb-4">
          <select onChange={handleAgentChange} className="border p-2 w-full">
            <option value="">Select an Agent</option>
            {agents.map(agent => (
              <option key={agent.agent_id} value={agent.agent_id}>
                {agent.computer_name} ({agent.agent_id})
              </option>
            ))}
          </select>
        </div>

        {selectedAgent && (
          <CardBox>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Agent Details</h2>
              <Button icon={mdiInformationOutline} color="primary" onClick={() => handleImdsModalOpen(resourceUsage[resourceUsage.length - 1].imds || '{}')}>
                Show IMDS Info
              </Button>
            </div>
            <p><strong>Agent ID:</strong> {selectedAgent.agent_id}</p>
            <p><strong>Hostname:</strong> {selectedAgent.computer_name}</p>
            <p><strong>Private IP:</strong> {selectedAgent.private_ip}</p>
            <p><strong>Running Time:</strong> {resourceUsage.length > 0 ? secondsToHMS(resourceUsage[resourceUsage.length - 1].running_time) : 'N/A'}</p>
            <p><strong>CPU Usage:</strong> {resourceUsage.length > 0 ? resourceUsage[resourceUsage.length - 1].cpu_usage : 'N/A'}%</p>
            <p><strong>Memory Usage:</strong> {resourceUsage.length > 0 ? resourceUsage[resourceUsage.length - 1].mem_usage : 'N/A'}%</p>
          </CardBox>
        )}

        {loading && <p>Loading resource usage...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && selectedAgent && resourceUsage.length > 0 && (
          <>
            <SectionTitleLineWithButton icon={mdiMonitor} title="CPU Usage" />
            <CardBox className="mb-6">
              <ChartLineSample data={cpuChartData} />
            </CardBox>
            <SectionTitleLineWithButton icon={mdiMonitor} title="Memory Usage" />
            <CardBox className="mb-6">
              <ChartLineSample data={memChartData} />
            </CardBox>
          </>
        )}
      </SectionMain>
      <ImdsModal isOpen={isImdsModalOpen} onClose={() => setIsImdsModalOpen(false)} json={imdsData} />
    </>
  );
};

AgentMonitoringPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentMonitoringPage;
