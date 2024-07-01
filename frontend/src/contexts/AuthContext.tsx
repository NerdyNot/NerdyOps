import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useBackendUrl } from '../contexts/BackendUrlContext';

interface AuthContextProps {
  user: { user_id: string; role: string } | null;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  verifyToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<{ user_id: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { backendUrl } = useBackendUrl();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, [backendUrl]);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${backendUrl}/login`, {
        username,
        password,
      });

      const { token, user_id, role } = response.data;
      localStorage.setItem('token', token);
      setUser({ user_id, role });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.post(`${backendUrl}/verify-token`, { token });
      setUser({ user_id: response.data.user_id, role: response.data.role });
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
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
