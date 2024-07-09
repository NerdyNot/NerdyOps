import { mdiSend, mdiAccount, mdiKey, mdiNetwork } from '@mdi/js';
import { Formik, Form, Field } from 'formik';
import Button from '../Button';
import CardBox from '../CardBox';
import FormField from '../Form/Field';
import { Agent } from '../../interfaces';

interface ConnectModalProps {
  agent: Agent;
  onClose: () => void;
  onSubmit: (values: { username: string; userpassword: string; host: string; port: string }) => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ agent, onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <Formik
          initialValues={{
            username: '',
            userpassword: '',
            host: agent.private_ip,
            port: '',
          }}
          onSubmit={onSubmit}
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
                <Button 
                  color="secondary" 
                  onClick={onClose}
                  label="Cancel" 
                />
              </div>
            </div>
          </Form>
        </Formik>
      </div>
    </div>
  );
};

export default ConnectModal;
