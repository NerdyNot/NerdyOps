// src/pages/tools-terminal.tsx
import {
    mdiConsole,
    mdiSend,
    mdiFileUpload,
    mdiDownload,
  } from '@mdi/js';
  import { Formik, Form, Field } from 'formik';
  import Head from 'next/head';
  import type { ReactElement } from 'react';
  import { useEffect, useState, useRef } from 'react';
  import { Terminal } from 'xterm';
  import { FitAddon } from 'xterm-addon-fit';
  import 'xterm/css/xterm.css';
  import Button from '../components/Button';
  import CardBox from '../components/CardBox';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  import FormField from '../components/Form/Field';
  import axios from 'axios';
  
  const ToolsTerminalPage = () => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminal = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [sessionOutput, setSessionOutput] = useState<string>('');
  
    useEffect(() => {
      terminal.current = new Terminal();
      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.open(terminalRef.current!);
      fitAddon.current.fit();
    }, []);
  
    useEffect(() => {
      const handleResize = () => {
        fitAddon.current?.fit();
      };
  
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const handleSendCommand = async (values: { command: string }) => {
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('command', values.command);
  
        setLoading(true);
        try {
          const response = await axios.post('/api/webssh', formData);
          setSessionOutput(response.data.output);
          terminal.current?.writeln(response.data.output);
          setLoading(false);
        } catch (error) {
          console.error('SSH command execution error:', error);
          setLoading(false);
        }
      } else {
        setLoading(true);
        try {
          const response = await axios.post('/api/webssh', values);
          setSessionOutput(response.data.output);
          terminal.current?.writeln(response.data.output);
          setLoading(false);
        } catch (error) {
          console.error('SSH command execution error:', error);
          setLoading(false);
        }
      }
    };
  
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setUploadedFile(event.target.files[0]);
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
                  command: '',
                }}
                onSubmit={handleSendCommand}
              >
                <Form className="flex flex-col">
                  <div className="p-4">
                    <FormField
                      label="Upload File"
                      help="Upload a file to execute commands on."
                      labelFor="file"
                      icons={[mdiFileUpload]}
                    >
                      <input
                        type="file"
                        name="file"
                        id="file"
                        onChange={handleFileUpload}
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <FormField
                      label="Command"
                      help="Enter the command you want to execute."
                      labelFor="command"
                      icons={[mdiConsole]}
                    >
                      <Field
                        name="command"
                        id="command"
                        placeholder="Enter command..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <div className="p-4 border-t">
                      <Button 
                        color="info" 
                        type="submit"
                        label={loading ? "Executing..." : "Execute"} 
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
  