import { createContext, useContext, ReactNode } from 'react';
import { db, type IDatabaseService } from '@/lib/database';

const DatabaseContext = createContext<IDatabaseService | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
  service?: IDatabaseService;
}

export const DatabaseProvider = ({ children, service = db }: DatabaseProviderProps) => {
  return (
    <DatabaseContext.Provider value={service}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): IDatabaseService => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
