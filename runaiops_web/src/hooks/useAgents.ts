import { useEffect, useState } from 'react';
import axios from 'axios';
import { Agent } from '../interfaces'; // 에이전트 타입 정의 파일

const useAgents = (url: string) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${url}/get-agents`)
      .then(response => {
        setAgents(response.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  return { agents, loading, error };
};

export default useAgents;
