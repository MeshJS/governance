// contexts/DataContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DataContextType } from 'types/datacontext';
import { useDataFetching } from '../data/hooks/useDataFetching';

export function useDataContext() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useDataContext must be used within a DataProvider');
    return ctx;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

type DataProviderProps = {
    children: React.ReactNode;
    fetchOptions?: {
        fetchChainTip?: boolean;
        fetchNetworkTotals?: boolean;
        fetchGovernanceProposals?: boolean;
        fetchSPOData?: boolean;
        fetchDRepData?: boolean;
        fetchCommitteeData?: boolean;
    };
};

export const DataProvider: React.FC<DataProviderProps> = ({ children, fetchOptions = {} }) => {
    const [isClient, setIsClient] = useState(false);
    const parentContext = useContext(DataContext);

    // Merge parent context's data with new fetch options
    const mergedFetchOptions = {
        ...(parentContext ? {
            fetchChainTip: parentContext.chainTip.length > 0 || fetchOptions.fetchChainTip,
            fetchNetworkTotals: parentContext.networkTotals.length > 0 || fetchOptions.fetchNetworkTotals,
            fetchGovernanceProposals: parentContext.governanceProposals.length > 0 || fetchOptions.fetchGovernanceProposals,
            fetchSPOData: parentContext.spoData.length > 0 || fetchOptions.fetchSPOData,
            fetchDRepData: parentContext.drepData.length > 0 || fetchOptions.fetchDRepData,
            fetchCommitteeData: parentContext.committeeData.length > 0 || fetchOptions.fetchCommitteeData,
        } : fetchOptions)
    };

    const data = useDataFetching(mergedFetchOptions);

    // Set isClient to true after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

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

    // Create a consistent initial state
    const contextValue = {
        ...data,
        // Only provide data after client-side hydration
        spoData: isClient ? data.spoData : [],
        governanceProposals: isClient ? data.governanceProposals : [],
        networkTotals: isClient ? data.networkTotals : [],
        chainTip: isClient ? data.chainTip : [],
        drepData: isClient ? data.drepData : [],
        committeeData: isClient ? data.committeeData : [],
        // Keep loading states consistent
        loading: {
            ...data.loading,
            spoData: !isClient || data.loading.spoData,
            governanceProposals: !isClient || data.loading.governanceProposals,
            networkTotals: !isClient || data.loading.networkTotals,
            chainTip: !isClient || data.loading.chainTip,
            drepData: !isClient || data.loading.drepData,
            committeeData: !isClient || data.loading.committeeData,
        }
    };
    //console.log(contextValue);
    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
}; 