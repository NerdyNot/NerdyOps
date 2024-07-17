import React, { useEffect, useState, ReactElement } from 'react';
import axios from 'axios';
import withAuth from '../utils/withAuth';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { getPageTitle } from '../config';
import { mdiKey } from '@mdi/js';
import Head from 'next/head';
import Button from '../components/Button';
import Cookies from 'js-cookie';

interface ApiKey {
  key_name: string;
  key_value: string;
}

const ApiKeySettingsPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newApiKey, setNewApiKey] = useState<ApiKey>({ key_name: '', key_value: '' });
  const [message, setMessage] = useState<string>('');
  const token = Cookies.get('token');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get('/api/get-all-api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApiKeys(response.data.apiKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const updatedApiKeys = [...apiKeys];
    updatedApiKeys[index] = { ...updatedApiKeys[index], [name]: value };
    setApiKeys(updatedApiKeys);
  };

  const handleNewApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewApiKey({ ...newApiKey, [name]: value });
  };

  const handleAddNewApiKey = () => {
    setApiKeys([...apiKeys, newApiKey]);
    setNewApiKey({ key_name: '', key_value: '' });
  };

  const handleSaveApiKeys = async () => {
    try {
      await axios.post('/api/set-all-api-keys', { apiKeys }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('API keys saved successfully!');
    } catch (error) {
      console.error('Error saving API keys:', error);
      setMessage('Failed to save API keys.');
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('API Key Settings')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiKey} title="API Key Settings" main />
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">API Key Settings</h2>
          <table className="w-full text-left table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Key Name</th>
                <th className="px-4 py-2 border">Key Value</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{apiKey.key_name}</td>
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      name="key_value"
                      value={apiKey.key_value}
                      onChange={(e) => handleInputChange(index, e)}
                      className="border p-2 w-full rounded-md"
                      placeholder="Enter API Key"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-4 py-2 border">
                  <input
                    type="text"
                    name="key_name"
                    value={newApiKey.key_name}
                    onChange={handleNewApiKeyChange}
                    className="border p-2 w-full rounded-md"
                    placeholder="New Key Name"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="text"
                    name="key_value"
                    value={newApiKey.key_value}
                    onChange={handleNewApiKeyChange}
                    className="border p-2 w-full rounded-md"
                    placeholder="New Key Value"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <Button label="Add New API Key" onClick={handleAddNewApiKey} color="secondary" />
          </div>
          <div className="mt-4">
            <Button label="Save API Keys" onClick={handleSaveApiKeys} color="primary" />
          </div>
          {message && <p className="mt-4">{message}</p>}
        </div>
      </SectionMain>
    </>
  );
};

ApiKeySettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default withAuth(ApiKeySettingsPage, ['admin']);
