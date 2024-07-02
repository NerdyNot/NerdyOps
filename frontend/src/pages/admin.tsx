import React, { useEffect, useState } from 'react';
import axios from 'axios';
import withAuth from '../utils/withAuth';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { useBackendUrl } from '../contexts/BackendUrlContext';
import { getPageTitle } from '../config';
import { mdiAccountCog, mdiPlus } from '@mdi/js';
import Head from 'next/head';
import Button from '../components/Button';
import Cookies from 'js-cookie';
import { Stack, Slider, Typography } from '@mui/material';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [apiKeyMessage, setApiKeyMessage] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [newSlackWebhookUrl, setNewSlackWebhookUrl] = useState('');
  const [slackMessage, setSlackMessage] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({ notificationsEnabled: false, taskCreated: false, taskApproved: false, taskRejected: false });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [redisConfig, setRedisConfig] = useState({ redis_host: '', redis_port: '', redis_password: '' });
  const [newRedisConfig, setNewRedisConfig] = useState({ redis_host: '', redis_port: '', redis_password: '' });
  const [redisMessage, setRedisMessage] = useState('');
  const token = Cookies.get('token');
  const { backendUrl } = useBackendUrl();
  const [isBackendUrlLoaded, setIsBackendUrlLoaded] = useState(false);
  const [llmConfig, setLlmConfig] = useState({
    provider: '',
    apiKey: '',
    model: '',
    temperature: 0.5,
    azureApiVersion: '',
    azureEndpoint: '',
    azureApiKey: ''
  });
  const [message, setMessage] = useState('');
  

  useEffect(() => {
    if (backendUrl) {
      setIsBackendUrlLoaded(true);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isBackendUrlLoaded) {
      fetchUsers();
      fetchApiKey();
      fetchSlackWebhook();
      fetchNotificationSettings();
      fetchRedisConfig();
      fetchLlmConfig();
    }
  }, [isBackendUrlLoaded]);
  
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Unauthorized access - maybe token is invalid or expired.');
      } else {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchApiKey = async () => {
    try {
      const response = await axios.get(`${backendUrl}/get-api-key`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApiKey(response.data.apiKey || '');
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const fetchSlackWebhook = async () => {
    try {
      const response = await axios.get(`${backendUrl}/get-slack-webhook`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSlackWebhookUrl(response.data.webhookUrl || '');
    } catch (error) {
      console.error('Error fetching Slack webhook URL:', error);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await axios.get(`${backendUrl}/get-slack-notification-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const settings = response.data;
      setNotificationSettings({
        notificationsEnabled: settings.slack_notifications_enabled,
        taskCreated: settings.slack_task_created,
        taskApproved: settings.slack_task_approved,
        taskRejected: settings.slack_task_rejected,
      });
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const fetchRedisConfig = async () => {
    try {
      const response = await axios.get(`${backendUrl}/get-redis-config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const config = response.data;
      setRedisConfig({
        redis_host: config.redis_host || '',
        redis_port: config.redis_port || '',
        redis_password: config.redis_password || '',
      });
      setNewRedisConfig({
        redis_host: config.redis_host || '',
        redis_port: config.redis_port || '',
        redis_password: config.redis_password || '',
      });
    } catch (error) {
      console.error('Error fetching Redis config:', error);
    }
  };

  const fetchLlmConfig = async () => {
    try {
      const response = await axios.get(`${backendUrl}/get-llm-config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data.llmConfig;
      setLlmConfig({
        provider: data.provider || '',
        apiKey: data.api_key || '',
        model: data.model || '',
        temperature: data.temperature !== undefined ? data.temperature : 0.5,
        azureApiVersion: data.azure?.api_version || '',
        azureEndpoint: data.azure?.endpoint || '',
        azureApiKey: data.azure?.api_key || '',
      });
    } catch (error) {
      console.error('Error fetching LLM configuration:', error);
    }
  };
  

  useEffect(() => {
    console.log('LLM Configuration:', llmConfig);
  }, [llmConfig]);

  const handleSaveLlmConfig = async () => {
    try {
      await axios.post(`${backendUrl}/set-llm-config`, llmConfig, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('LLM configuration saved successfully!');
    } catch (error) {
      console.error('Error saving LLM configuration:', error);
      setMessage('Failed to save LLM configuration.');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLlmConfig(prevConfig => ({ ...prevConfig, [name]: value }));
  };
  
  const handleSliderChange = (event: any, newValue: number | number[]) => {
    setLlmConfig(prevConfig => ({ ...prevConfig, temperature: newValue as number }));
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${backendUrl}/register`, newUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('User registered successfully');
      fetchUsers();
      setShowRegisterForm(false);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  const handleRoleUpdate = async () => {
    try {
      await axios.post(`${backendUrl}/update-role`, { user_id: selectedUserId, new_role: newRole }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handlePasswordChange = async () => {
    try {
      await axios.post(`${backendUrl}/change-password-admin`, { user_id: selectedUserId, new_password: newPassword }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Password updated successfully');
      setShowPasswordForm(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await axios.post(`${backendUrl}/set-api-key`, { apiKey: newApiKey }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApiKeyMessage('API key saved successfully!');
      setApiKey(newApiKey.slice(0, 4) + '****' + newApiKey.slice(-4)); // Mask the new API key
      setNewApiKey('');
    } catch (error) {
      console.error('Error saving API key:', error);
      setApiKeyMessage('Failed to save API key.');
    }
  };

  const handleSaveSlackWebhookUrl = async () => {
    try {
      await axios.post(`${backendUrl}/set-slack-webhook`, { webhookUrl: newSlackWebhookUrl }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSlackWebhookUrl(newSlackWebhookUrl);
      setNewSlackWebhookUrl('');
      setNotificationMessage('Slack webhook URL saved successfully!');
    } catch (error) {
      console.error('Error saving Slack webhook URL:', error);
      setNotificationMessage('Failed to save Slack webhook URL.');
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await axios.post(`${backendUrl}/set-slack-notification-settings`, notificationSettings, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotificationMessage('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setNotificationMessage('Failed to save notification settings.');
    }
  };

  const handleSendTestMessage = async () => {
    try {
      await axios.post(`${backendUrl}/add-slack-notification`, { message: slackMessage, type: 'test' }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSlackMessage('');
      setNotificationMessage('Test message sent successfully!');
    } catch (error) {
      console.error('Error sending test message:', error);
      setNotificationMessage('Failed to send test message.');
    }
  };

  const handleSaveRedisConfig = async () => {
    try {
      await axios.post(`${backendUrl}/set-redis-config`, newRedisConfig, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRedisMessage('Redis configuration saved successfully!');
      setRedisConfig(newRedisConfig);
      setNewRedisConfig({ redis_host: '', redis_port: '', redis_password: '' });
    } catch (error) {
      console.error('Error saving Redis config:', error);
      setRedisMessage('Failed to save Redis configuration.');
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle('Admin')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiAccountCog} title="Admin Page" main>
          <Button
            icon={mdiPlus}
            label="Register New User"
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            color="primary"
          />
        </SectionTitleLineWithButton>

        {showRegisterForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Register New User</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <div className="mb-4">
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border p-2 w-full rounded-md">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              label="Register"
              onClick={handleRegister}
              color="primary"
            />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">User List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="py-2 px-4">Username</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Role</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {users.map((user: any) => (
                  <tr key={user.user_id}>
                    <td className="py-2 px-4 border">{user.username}</td>
                    <td className="py-2 px-4 border">{user.email}</td>
                    <td className="py-2 px-4 border">
                      <select value={selectedUserId === user.user_id ? newRole : user.role} onChange={(e) => { setSelectedUserId(user.user_id); setNewRole(e.target.value); }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 border">
                      <Button
                        label="Update Role"
                        onClick={handleRoleUpdate}
                        color="success"
                      />
                      <Button
                        label="Change Password"
                        onClick={() => { setSelectedUserId(user.user_id); setShowPasswordForm(true); }}
                        color="warning"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showPasswordForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Change User Password</h2>
            <div className="mb-4">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border p-2 w-full rounded-md"
              />
            </div>
            <Button
              label="Change Password"
              onClick={handlePasswordChange}
              color="primary"
            />
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Redis Configuration</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Redis Host"
              value={newRedisConfig.redis_host}
              onChange={(e) => setNewRedisConfig({ ...newRedisConfig, redis_host: e.target.value })}
              className="border p-2 w-full rounded-md"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Redis Port"
              value={newRedisConfig.redis_port}
              onChange={(e) => setNewRedisConfig({ ...newRedisConfig, redis_port: e.target.value })}
              className="border p-2 w-full rounded-md"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Redis Password"
              value={newRedisConfig.redis_password}
              onChange={(e) => setNewRedisConfig({ ...newRedisConfig, redis_password: e.target.value })}
              className="border p-2 w-full rounded-md"
            />
          </div>
          <Button label="Save Redis Configuration" onClick={handleSaveRedisConfig} color="primary" />
          {redisMessage && <p>{redisMessage}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">LLM Configuration</h2>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Provider</label>
            <select name="provider" value={llmConfig.provider} onChange={handleChange} className="border p-2 w-full rounded-md">
              <option value="">Select Provider</option>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="vertexai">Vertex AI</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">API Key</label>
            <input
              type="password"
              name="apiKey"
              placeholder="Enter API Key"
              value={llmConfig.apiKey}
              onChange={handleChange}
              className="border p-2 w-full rounded-md"
            />
          </div>
          {llmConfig.provider === 'azure' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Azure API Version</label>
                <input
                  type="text"
                  name="azureApiVersion"
                  placeholder="Enter Azure API Version"
                  value={llmConfig.azureApiVersion}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Azure Endpoint</label>
                <input
                  type="text"
                  name="azureEndpoint"
                  placeholder="Enter Azure Endpoint"
                  value={llmConfig.azureEndpoint}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Azure API Key</label>
                <input
                  type="password"
                  name="azureApiKey"
                  placeholder="Enter Azure API Key"
                  value={llmConfig.azureApiKey}
                  onChange={handleChange}
                  className="border p-2 w-full rounded-md"
                />
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Model</label>
            <input
              type="text"
              name="model"
              placeholder="Enter Model Name"
              value={llmConfig.model}
              onChange={handleChange}
              className="border p-2 w-full rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Temperature</label>
            <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
              <Typography variant="body2">0</Typography>
              <Slider
                aria-label="Temperature"
                value={llmConfig.temperature}
                onChange={handleSliderChange}
                step={0.1}
                min={0}
                max={1}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2">1</Typography>
            </Stack>
          </div>
          <Button label="Save LLM Configuration" onClick={handleSaveLlmConfig} color="primary" />
          {message && <p>{message}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Slack Webhook URL</h2>
          {slackWebhookUrl ? (
            <p>Current Slack Webhook URL: {slackWebhookUrl}</p>
          ) : (
            <p>No Slack webhook URL set</p>
          )}
          <div className="mb-4">
            <input
              type="password"
              placeholder="Enter new Slack Webhook URL"
              value={newSlackWebhookUrl}
              onChange={(e) => setNewSlackWebhookUrl(e.target.value)}
              className="border p-2 w-full rounded-md"
            />
          </div>
          <Button label="Save Slack Webhook URL" onClick={handleSaveSlackWebhookUrl} color="primary" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Enable Notifications
              <input
                type="checkbox"
                checked={notificationSettings.notificationsEnabled}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, notificationsEnabled: e.target.checked })}
                className="ml-2"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Task Created
              <input
                type="checkbox"
                checked={notificationSettings.taskCreated}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, taskCreated: e.target.checked })}
                className="ml-2"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Task Approved
              <input
                type="checkbox"
                checked={notificationSettings.taskApproved}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, taskApproved: e.target.checked })}
                className="ml-2"
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Task Rejected
              <input
                type="checkbox"
                checked={notificationSettings.taskRejected}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, taskRejected: e.target.checked })}
                className="ml-2"
              />
            </label>
          </div>
          <Button label="Save Notification Settings" onClick={handleSaveNotificationSettings} color="primary" />
          {notificationMessage && <p>{notificationMessage}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Send Test Slack Message</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter test message"
              value={slackMessage}
              onChange={(e) => setSlackMessage(e.target.value)}
              className="border p-2 w-full rounded-md"
            />
          </div>
          <Button label="Send Test Message" onClick={handleSendTestMessage} color="primary" />
        </div>
      </SectionMain>
    </>
  );
};

AdminPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default withAuth(AdminPage, ['admin']);
