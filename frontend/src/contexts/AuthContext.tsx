import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

interface AuthContextProps {
  user: { user_id: string; role: string } | null;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<{ user_id: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/login', {
        username,
        password,
      });

      const { token, user_id, role } = response.data;
      localStorage.setItem('token', token);
      document.cookie = `token=${token}; path=/;`;
      setUser({ user_id, role });
      setError(null); // 로그인 성공 시 에러 초기화
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/login');
  };

  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    try {
      const response = await axios.post('/api/verify-token', { token });
      setUser({ user_id: response.data.user_id, role: response.data.role });
      setError(null); // 토큰 검증 성공 시 에러 초기화
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
      logout(); // 토큰 검증 실패 시 로그아웃 처리
    }
  };

  return (
    <AuthContext.Provider value={{ user, error, login, logout, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
