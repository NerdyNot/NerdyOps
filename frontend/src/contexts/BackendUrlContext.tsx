import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Create a context for the backend URL
interface BackendUrlContextProps {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
}

const BackendUrlContext = createContext<BackendUrlContextProps | undefined>(undefined);

export const useBackendUrl = (): BackendUrlContextProps => {
  const context = useContext(BackendUrlContext);
  if (!context) {
    throw new Error('useBackendUrl must be used within a BackendUrlProvider');
  }
  return context;
};

interface BackendUrlProviderProps {
  children: ReactNode;
}

export const BackendUrlProvider = ({ children }: BackendUrlProviderProps) => {
  const [backendUrl, setBackendUrl] = useState<string>('');

  useEffect(() => {
    const storedBackendUrl = localStorage.getItem('backendUrl');
    if (storedBackendUrl) {
      setBackendUrl(storedBackendUrl);
    }
  }, []);

  return (
    <BackendUrlContext.Provider value={{ backendUrl, setBackendUrl }}>
      {children}
    </BackendUrlContext.Provider>
  );
};
