// src/pages/tools-terminal.tsx
import {
    mdiConsole,
    mdiSend,
  } from '@mdi/js';
  import { useEffect, useRef, useState } from 'react';
  import { Terminal } from 'xterm';
  import { FitAddon } from 'xterm-addon-fit';
  import 'xterm/css/xterm.css';
  import Head from 'next/head';
  import Button from '../components/Button';
  import CardBox from '../components/CardBox';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  
  const ToolsTerminalPage = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);
    const [input, setInput] = useState<string>('');
  
    useEffect(() => {
      terminal.current = new Terminal();
      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.open(terminalRef.current!);
      fitAddon.current.fit();
  
      // WebSocket 연결 설정
      ws.current = new WebSocket(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/webssh`);
      
      ws.current.onopen = () => {
        setConnected(true);
        terminal.current?.writeln('Connected to the server');
      };
  
      ws.current.onmessage = (event) => {
        terminal.current?.writeln(event.data);
      };
  
      ws.current.onclose = () => {
        setConnected(false);
        terminal.current?.writeln('Disconnected from the server');
      };
  
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      return () => {
        ws.current?.close();
      };
    }, []);
  
    useEffect(() => {
      const handleResize = () => {
        fitAddon.current?.fit();
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const handleSend = () => {
      if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(input);
        setInput('');
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
              <div className="p-4">
                <div ref={terminalRef} style={{ height: '500px', width: '100%', background: '#000' }}></div>
                <div className="flex mt-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="Enter command..."
                    disabled={!connected}
                  />
                  <Button 
                    color="info" 
                    label="Send" 
                    icon={mdiSend} 
                    onClick={handleSend} 
                    disabled={!connected || !input.trim()}
                  />
                </div>
              </div>
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
  