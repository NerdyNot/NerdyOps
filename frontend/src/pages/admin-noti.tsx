import React, { useEffect, useState } from 'react';
import axios from 'axios';
import withAuth from '../utils/withAuth';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/Section/Main';
import SectionTitleLineWithButton from '../components/Section/TitleLineWithButton';
import { useBackendUrl } from '../contexts/BackendUrlContext';
import { getPageTitle } from '../config';
import { mdiBellOutline } from '@mdi/js';
import Head from 'next/head';
import Button from '../components/Button';
import Cookies from 'js-cookie';

const NotificationSettingsPage: React.FC = () => {
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [newSlackWebhookUrl, setNewSlackWebhookUrl] = useState('');
  const [slackMessage, setSlackMessage] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({ notificationsEnabled: false, taskCreated: false, taskApproved: false, taskRejected: false });
  const [notificationMessage, setNotificationMessage] = useState('');
  const token = Cookies.get('token');
  const { backendUrl } = useBackendUrl();
  const [isBackendUrlLoaded, setIsBackendUrlLoaded] = useState(false);

  useEffect(() => {
    if (backendUrl) {
      setIsBackendUrlLoaded(true);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isBackendUrlLoaded) {
      fetchSlackWebhook();
      fetchNotificationSettings();
    }
  }, [isBackendUrlLoaded]);

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

  return (
    <>
      <Head>
        <title>{getPageTitle('Notification Settings')}</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton icon={mdiBellOutline} title="Notification Settings" main />
        
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

NotificationSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default withAuth(NotificationSettingsPage, ['admin']);
