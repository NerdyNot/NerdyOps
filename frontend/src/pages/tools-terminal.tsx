import {
    mdiSend,
    mdiServerNetwork,
    mdiAccount,
    mdiKey,
    mdiNetwork,
  } from '@mdi/js';
  import { Formik, Form, Field } from 'formik';
  import Head from 'next/head';
  import type { ReactElement } from 'react';
  import { useState } from 'react';
  import Button from '../components/Button';
  import CardBox from '../components/CardBox';
  import LayoutAuthenticated from '../layouts/Authenticated';
  import SectionMain from '../components/Section/Main';
  import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
  import { getPageTitle } from '../config';
  import FormField from '../components/Form/Field';
  import axios from 'axios';
  
  const SSHPage = () => {
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  
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
      } catch (error) {
        console.error('Connection error:', error);
      }
    };
  
    return (
      <>
        <Head>
          <title>{getPageTitle('SSH Connection')}</title>
        </Head>
  
        <SectionMain>
          <SectionTitleLineWithButton icon={mdiServerNetwork} title="SSH Connection" main />
          <div className="grid gap-6">
            <CardBox>
              <Formik
                initialValues={{
                  username: '',
                  userpassword: '',
                  host: '',
                  port: '',
                }}
                onSubmit={handleConnection}
              >
                <Form className="flex flex-col">
                  <div className="p-4">
                    <FormField
                      label="Username"
                      help="Enter the SSH username."
                      labelFor="username"
                      icons={[mdiAccount]}
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
                      help="Enter the SSH password."
                      labelFor="userpassword"
                      icons={[mdiKey]}
                    >
                      <Field
                        name="userpassword"
                        id="userpassword"
                        type="password"
                        placeholder="Enter password..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <FormField
                      label="Host"
                      help="Enter the SSH host address."
                      labelFor="host"
                      icons={[mdiNetwork]}
                    >
                      <Field
                        name="host"
                        id="host"
                        placeholder="Enter host..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <FormField
                      label="Port"
                      help="Enter the SSH port."
                      labelFor="port"
                      icons={[mdiNetwork]}
                    >
                      <Field
                        name="port"
                        id="port"
                        placeholder="Enter port..."
                        className="w-full p-2 border rounded"
                      />
                    </FormField>
  
                    <div className="p-4 border-t">
                      <Button 
                        color="info" 
                        type="submit"
                        label="Connect" 
                        icon={mdiSend} 
                      />
                    </div>
                  </div>
                </Form>
              </Formik>
            </CardBox>
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
  