import { mdiServerNetwork, mdiSend } from '@mdi/js';
import { Formik, Form, Field } from 'formik';
import Head from 'next/head';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import Button from '../components/Button';
import CardBox from '../components/CardBox';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import FormField from '../components/Form/Field';

const TerminalPage = () => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleConnection = (values: {
    host: string;
    username: string;
    userpassword: string;
    port: number;
  }) => {
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
            <Formik
              initialValues={{
                host: '',
                username: '',
                userpassword: '',
                port: 22,
              }}
              onSubmit={handleConnection}
            >
              <Form className="flex flex-col">
                <div className="p-4">
                  <FormField
                    label="Host"
                    help="Enter the host address."
                    labelFor="host"
                    icons={[mdiServerNetwork]}
                  >
                    <Field
                      name="host"
                      id="host"
                      placeholder="Enter host address..."
                      className="w-full p-2 border rounded"
                    />
                  </FormField>

                  <FormField
                    label="Username"
                    help="Enter the SSH username."
                    labelFor="username"
                    icons={[mdiServerNetwork]}
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
                    icons={[mdiServerNetwork]}
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
                    label="Port"
                    help="Enter the SSH port (default: 22)."
                    labelFor="port"
                    icons={[mdiServerNetwork]}
                  >
                    <Field
                      name="port"
                      id="port"
                      type="number"
                      placeholder="22"
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
