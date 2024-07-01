import { useEffect, useState } from 'react';
import axios from 'axios';
import { Agent } from '../interfaces'; 

const useAgents = (url: string) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUrlLoaded, setIsUrlLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (url) {
      setIsUrlLoaded(true);
    }
  }, [url]);

  const fetchAgents = async () => {
    if (!isUrlLoaded) return;

    setLoading(true);
    try {
      const response = await axios.get(`${url}/get-agents`);
      setAgents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [isUrlLoaded, url]);

  return { agents, loading, error, mutate: fetchAgents };
};

export default useAgents;
