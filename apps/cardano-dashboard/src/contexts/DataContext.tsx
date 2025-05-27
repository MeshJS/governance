// contexts/DataContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { DataContextType } from 'types/datacontext';
import { useDataFetching } from '../data/hooks/useDataFetching';

export function useDataContext() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useDataContext must be used within a DataProvider');
    return ctx;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const data = useDataFetching();

    // Log errors when they occur
    useEffect(() => {
        if (data.isError.chainTip) {
            console.error('Chain tip error:', data.error.chainTip);
        }
        if (data.isError.networkTotals) {
            console.error('Network totals error:', data.error.networkTotals);
        }
        if (data.isError.governanceProposals) {
            console.error('Governance proposals error:', data.error.governanceProposals);
        }
        if (data.isError.spoData) {
            console.error('SPO data error:', data.error.spoData);
        }
        if (data.isError.drepData) {
            console.error('DRep data error:', data.error.drepData);
        }
        if (data.isError.committeeData) {
            console.error('Committee data error:', data.error.committeeData);
        }
    }, [data.isError, data.error]);
    console.log(data);

    return (
        <DataContext.Provider value={data}>
            {children}
        </DataContext.Provider>
    );
}; 