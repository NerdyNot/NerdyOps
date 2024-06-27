import { mdiServer, mdiChartTimelineVariant, mdiMonitor, mdiReload } from '@mdi/js';
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

const AgentMonitoringPage = () => {
  const centralServerUrl = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL;
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [resourceUsage, setResourceUsage] = useState([]);
  const [cpuChartData, setCpuChartData] = useState({ datasets: [] });
  const [memChartData, setMemChartData] = useState({ datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchResourceUsage = (agentId) => {
    setLoading(true);
    axios.get(`${centralServerUrl}/get-resource-usage?agent_id=${agentId}`)
      .then(response => {
        const data = response.data;
        setResourceUsage(data);

        const labels = data.map(item => new Date(item.timestamp * 1000).toLocaleTimeString());
        const cpuData = data.map(item => item.cpu_usage);
        const memData = data.map(item => item.mem_usage);

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

  const handleAgentChange = (e) => {
    const agentId = e.target.value;
    const agent = agents.find(agent => agent.agent_id === agentId);
    setSelectedAgent(agent);
  };

  const handleReload = (e) => {
    e.preventDefault();
    if (selectedAgent) {
      fetchResourceUsage(selectedAgent.agent_id);
    }
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
            <h2 className="text-xl font-semibold mb-4">Agent Details</h2>
            <p><strong>Agent ID:</strong> {selectedAgent.agent_id}</p>
            <p><strong>Hostname:</strong> {selectedAgent.computer_name}</p>
            <p><strong>Private IP:</strong> {selectedAgent.private_ip}</p>
            <p><strong>Running Time:</strong> {resourceUsage.length > 0 ? resourceUsage[resourceUsage.length - 1].running_time : 'N/A'} seconds</p>
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
    </>
  );
};

AgentMonitoringPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default AgentMonitoringPage;