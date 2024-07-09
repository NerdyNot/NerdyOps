import {
    mdiServerNetwork,
  } from '@mdi/js';
  import Head from 'next/head';
  import type { ReactElement } from 'react';
  import { useState } from 'react';
  import CardBox from '../components/CardBox';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  import axios from 'axios';
  import useAgents from '../hooks/useAgents';
  import { Agent } from '../interfaces';
  import TerminalAgentList from '../components/TerminalAgentList';
  import ConnectModal from '../components/Modal/ConnectModal';
  
  const SSHPage = () => {
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [connectAgent, setConnectAgent] = useState<Agent | null>(null);
  
    const { agents, loading, error } = useAgents();
  
    const handleConnection = async (values: {
      username: string;
      userpassword: string;
      host: string;
      port: string;
    }) => {
      try {
        const response = await axios.post('/api/connect', values);
        const { url } = response.data;
        setIframeUrl(url);
        setConnectAgent(null); // close the modal after connection
      } catch (error) {
        console.error('Connection error:', error);
      }
    };
  
    const handleConnectClick = (agent: Agent) => {
      setConnectAgent(agent);
    };
  
    const handleCloseModal = () => {
      setConnectAgent(null);
    };
  
    return (
      <>
        <Head>
          <title>{getPageTitle('Terminal Connection')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiServerNetwork} title="Terminal Connection" main />
          <div className="grid gap-6">
            <CardBox>
              {loading && <p>Loading agents...</p>}
              {error && <p>Error loading agents: {error}</p>}
              {!loading && !error && agents && (
                <TerminalAgentList agents={agents} onConnectClick={handleConnectClick} />
              )}
            </CardBox>
  
            {connectAgent && (
              <ConnectModal agent={connectAgent} onClose={handleCloseModal} onSubmit={handleConnection} />
            )}
  
            {iframeUrl && (
              <CardBox>
                <iframe src={iframeUrl} width="100%" height="600px" />
              </CardBox>
            )}
          </div>
        </SectionMain>
      </>
    );
  };
  
  SSHPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default SSHPage;
  
  // Next.js API route to handle the POST request
  export async function handler(req, res) {
    if (req.method === 'POST') {
      const { username, userpassword, host, port } = req.body;
      const url = `http://${req.headers.host.split(':')[0]}:2222/ssh/host/${host}?username=${username}&password=${userpassword}&port=${port}`;
      res.status(200).json({ url });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }
  