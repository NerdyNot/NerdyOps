import { useState } from 'react';
import axios from 'axios';

interface LoginResponse {
  status: string;
  user_id: string;
  role: string;
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const login = async (username: string, password: string): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<LoginResponse>(`${process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL}/login`, {
        username,
        password,
      });

      localStorage.setItem('token', response.data.user_id); // 토큰 저장 방식에 따라 수정 가능
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, error, loading };
};

export default useAuth;
