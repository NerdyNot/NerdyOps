import {
    mdiConsole,
    mdiSend,
  } from '@mdi/js';
  import { Formik, Form, Field } from 'formik';
  import Head from 'next/head';
  import dynamic from 'next/dynamic';
  import type { ReactElement } from 'react';
  import { useEffect, useState, useRef } from 'react';
  import 'xterm/css/xterm.css';
  import Button from '../components/Button';
  import CardBox from '../components/CardBox';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  import FormField from '../components/Form/Field';
  import axios from 'axios';
  
  // 동적으로 xterm 및 xterm-addon-fit 불러오기
  const Terminal = dynamic(
    () => import('xterm').then(mod => mod.Terminal),
    { ssr: false }
  );
  const FitAddon = dynamic(
    () => import('xterm-addon-fit').then(mod => mod.FitAddon),
    { ssr: false }
  );
  
  const ToolsTerminalPage = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<any>(null);
    const fitAddon = useRef<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [session, setSession] = useState<WebSocket | null>(null);
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const initTerminal = async () => {
          const { Terminal } = await import('xterm');
          const { FitAddon } = await import('xterm-addon-fit');
          terminal.current = new Terminal();
          fitAddon.current = new FitAddon();
          terminal.current.loadAddon(fitAddon.current);
          terminal.current.open(terminalRef.current!);
          fitAddon.current.fit();
  
          terminal.current.onData((data: string) => {
            if (session) {
              session.send(JSON.stringify({ type: 'input', data }));
            }
          });
        };
        initTerminal();
      }
    }, [session]);
  
    useEffect(() => {
      const handleResize = () => {
        fitAddon.current?.fit();
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const handleConnect = async (values: { server: string; username: string; password: string }) => {
      setLoading(true);
      try {
        const response = await axios.post('/api/connect', values);
        const { sessionId } = response.data;
        const ws = new WebSocket(`ws://localhost:3000/api/terminal/${sessionId}`);
  
        ws.onopen = () => {
          terminal.current?.writeln('Connected to server');
          setSession(ws);
        };
  
        ws.onmessage = (event) => {
          const { data } = event;
          terminal.current?.writeln(data);
        };
  
        ws.onclose = () => {
          terminal.current?.writeln('Connection closed');
        };
  
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          terminal.current?.writeln('WebSocket error');
        };
  
        setLoading(false);
      } catch (error) {
        console.error('Connection error:', error);
        terminal.current?.writeln('Connection error');
        setLoading(false);
      }
    };
  
    return (
      <>
        <Head>
          <title>{getPageTitle('Terminal')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiConsole} title="Terminal" main />
          <div className="grid gap-6">
            <CardBox>
              <Formik
                initialValues={{
                  server: '',
                  username: '',
                  password: '',
                }}
                onSubmit={handleConnect}
              >
                <Form className="flex flex-col">
                  <div className="p-4">
                    <FormField
                      label="Server Address"
                      help="Enter the address of the server."
                      labelFor="server"
                      icons={[mdiConsole]}
                    >
                      <Field
                        name="server"
                        id="server"
                        placeholder="Enter server address..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <FormField
                      label="Username"
                      help="Enter your username for the server."
                      labelFor="username"
                      icons={[mdiConsole]}
                    >
                      <Field
                        name="username"
                        id="username"
                        placeholder="Enter username..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <FormField
                      label="Password"
                      help="Enter your password for the server."
                      labelFor="password"
                      icons={[mdiConsole]}
                    >
                      <Field
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Enter password..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <div className="p-4 border-t">
                      <Button
                        color="info"
                        type="submit"
                        label={loading ? "Connecting..." : "Connect"}
                        icon={mdiSend}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </Form>
              </Formik>
  
              <div ref={terminalRef} style={{ height: '500px', width: '100%', background: '#000' }}></div>
            </CardBox>
          </div>
        </SectionMain>
      </>
    );
  };
  
  ToolsTerminalPage.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
  };
  
  export default ToolsTerminalPage;
  