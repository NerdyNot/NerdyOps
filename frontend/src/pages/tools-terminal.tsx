import {
    mdiSend,
    mdiServerNetwork,
  } from '@mdi/js';
  import Head from 'next/head';
  import type { ReactElement } from 'react';
  import { useState, useRef } from 'react';
  import axios from 'axios';
  import Button from '../components/Button';
  import CardBox from '../components/CardBox';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  import useAgents from '../hooks/useAgents';
  import { Agent } from '../interfaces';
  import TerminalAgentList from '../components/TerminalAgentList';
  import ConnectModal from '../components/Modal/ConnectModal';
  
  const TerminalPage = () => {
    const [connectAgent, setConnectAgent] = useState<Agent | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
  
    const { agents, loading, error } = useAgents();
  
    const handleConnection = async (values: {
      host: string;
      username: string;
      userpassword: string;
      port: number;
      token: string;
    }) => {
      try {
        const verifyResponse = await axios.post('/api/verify-token', { token: values.token });
  
        if (verifyResponse.status !== 200) {
          throw new Error('Token verification failed');
        }
  
        if (formRef.current) {
          const { host, username, userpassword, port } = values;
  
          const form = formRef.current;
          form.action = `/ssh/host/${host}`;
          form.method = 'POST';
          form.target = '_blank';
  
          form.querySelector('input[name="username"]').value = username;
          form.querySelector('input[name="userpassword"]').value = userpassword;
          form.querySelector('input[name="port"]').value = port.toString();
  
          form.submit();
        }
      } catch (error) {
        console.error('Connection error:', error);
        alert('Token verification failed');
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
          <title>{getPageTitle('SSH Terminal')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiServerNetwork} title="SSH Terminal" main />
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
          </div>
        </SectionMain>
  
        <form ref={formRef} style={{ display: 'none' }}>
          <input type="hidden" name="username" />
          <input type="hidden" name="userpassword" />
          <input type="hidden" name="port" />
        </form>
      </>
    );
  };
  
  TerminalPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default TerminalPage;
  