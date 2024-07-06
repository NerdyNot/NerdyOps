import React, { useState, useEffect } from 'react';
import Button from '../Button';
import axios from 'axios';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, agentId }) => {
  const [checkSchedule, setCheckSchedule] = useState(false);
  const [checkPing, setCheckPing] = useState('');
  const [runningProcess, setRunningProcess] = useState('');
  const [listenPort, setListenPort] = useState('');

  useEffect(() => {
    if (isOpen && agentId) {
      axios.get(`/api/get-monitoring-settings?agent_id=${agentId}`)
        .then(response => {
          const data = response.data;
          setCheckSchedule(data.check_schedule);
          setCheckPing(data.check_ping);
          setRunningProcess(data.running_process);
          setListenPort(data.listen_port);
        })
        .catch(error => {
          console.error('Error fetching monitoring settings:', error);
        });
    } else {
      // Reset settings when modal is closed
      setCheckSchedule(false);
      setCheckPing('');
      setRunningProcess('');
      setListenPort('');
    }
  }, [isOpen, agentId]);

  const handleSaveSettings = () => {
    const settings = {
      agent_id: agentId,
      check_schedule: checkSchedule,
      check_ping: checkPing,
      running_process: runningProcess,
      listen_port: listenPort,
    };

    axios.post(`/api/set-monitoring-settings`, settings)
      .then(() => {
        alert('Settings saved successfully!');
        onClose();
      })
      .catch(error => {
        console.error('Error saving settings:', error);
        alert('Failed to save settings');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-4xl overflow-y-auto max-h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Agent Monitoring Settings</h2>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
          >
            Close
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Check Maintenance</label>
          <input
            type="checkbox"
            checked={checkSchedule}
            onChange={e => setCheckSchedule(e.target.checked)}
            className="form-checkbox"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Check Ping (comma-separated targets)</label>
          <input
            type="text"
            value={checkPing}
            onChange={e => setCheckPing(e.target.value)}
            className="border p-2 w-full rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Running Process (comma-separated processes)</label>
          <input
            type="text"
            value={runningProcess}
            onChange={e => setRunningProcess(e.target.value)}
            className="border p-2 w-full rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Listen Port (comma-separated ports)</label>
          <input
            type="text"
            value={listenPort}
            onChange={e => setListenPort(e.target.value)}
            className="border p-2 w-full rounded-md"
          />
        </div>
        <div className="flex justify-end">
          <Button label="Save" onClick={handleSaveSettings} color="primary" />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
