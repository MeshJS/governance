// contexts/DataContext.tsx
import React, { createContext, useContext } from 'react';
import { DataContextType } from '../types/datacontext';
import { useDataFetching } from '../data/hooks/useDataFetching';

export function useDataContext() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useDataContext must be used within a DataProvider');
    return ctx;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const data = useDataFetching();
    console.log('DataContext', data);
    return (
        <DataContext.Provider value={data}>
            {children}
        </DataContext.Provider>
    );
}; 