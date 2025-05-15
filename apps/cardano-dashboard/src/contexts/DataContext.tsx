import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { WithdrawalRecord, DataContextType } from '../types/datacontext';
import { NetworkTotals, NetworkTotalsResponse } from '../types/network';
import { GovernanceProposal, GovernanceProposalResponse } from '../types/governance';

export function useDataContext() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useDataContext must be used within a DataProvider');
    return ctx;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const fetchNetworkTotalsFromSupabase = async (): Promise<NetworkTotals[]> => {
    const { data, error } = await supabase
        .from('network_totals')
        .select('*')
        .order('epoch_no', { ascending: false });

    if (error) {
        console.error('Error fetching from Supabase:', error);
        throw error;
    }

    console.log('Fetched Network Totals from Supabase:', data);
    return data || [];
};

const fetchNetworkTotalsFromKoios = async (epochNo?: number): Promise<NetworkTotalsResponse> => {
    const url = `/api/koios-network${epochNo ? `?_epoch_no=${epochNo}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch network totals from Koios');
    const data = await res.json();
    console.log('Fetched Network Totals from Koios:', data);
    return data;
};

const fetchGovernanceProposalsFromSupabase = async (): Promise<GovernanceProposal[]> => {
    const { data, error } = await supabase
        .from('governance_proposals')
        .select('*')
        .order('proposed_epoch', { ascending: false });

    if (error) {
        console.error('Error fetching governance proposals from Supabase:', error);
        throw error;
    }

    console.log('Fetched Governance Proposals from Supabase:', data);
    return data || [];
};

const fetchGovernanceProposalsFromKoios = async (): Promise<GovernanceProposalResponse> => {
    const res = await fetch('/api/koios-governance');
    if (!res.ok) throw new Error('Failed to fetch governance proposals from Koios');
    const data = await res.json();
    console.log('Fetched Governance Proposals from Koios:', data);
    return data;
};

const upsertNetworkTotals = async (totals: NetworkTotals[]): Promise<void> => {
    if (!totals.length) return;

    // Convert string values to numeric for all epochs
    const processedTotals = totals.map(total => ({
        epoch_no: total.epoch_no,
        circulation: Number(total.circulation),
        treasury: Number(total.treasury),
        reward: Number(total.reward),
        supply: Number(total.supply),
        reserves: Number(total.reserves),
        fees: Number(total.fees),
        deposits_stake: Number(total.deposits_stake),
        deposits_drep: Number(total.deposits_drep),
        deposits_proposal: Number(total.deposits_proposal),
    }));

    console.log('Upserting Network Totals:', processedTotals);
    const { error } = await supabase
        .from('network_totals')
        .upsert(processedTotals, { onConflict: 'epoch_no' });

    if (error) {
        console.error('Error upserting network totals:', error);
        throw error;
    }
};

const upsertGovernanceProposals = async (proposals: GovernanceProposal[]): Promise<void> => {
    if (!proposals.length) return;

    console.log('Upserting Governance Proposals:', proposals);
    const { error } = await supabase
        .from('governance_proposals')
        .upsert(proposals, { onConflict: 'proposal_id' });

    if (error) {
        console.error('Error upserting governance proposals:', error);
        throw error;
    }
};

const fetchAndUpdateNetworkTotals = async (): Promise<NetworkTotals[]> => {
    // First, fetch all data from Supabase
    const supabaseData = await fetchNetworkTotalsFromSupabase();

    if (supabaseData.length === 0) {
        // If no data in Supabase, fetch all from Koios
        const koiosData = await fetchNetworkTotalsFromKoios();
        await upsertNetworkTotals(koiosData);
        return koiosData;
    }

    // Get the latest epoch from Supabase
    const latestEpoch = supabaseData[0].epoch_no;

    // Fetch only the latest epoch from Koios to check if we need to update
    const latestKoiosData = await fetchNetworkTotalsFromKoios(latestEpoch);

    if (latestKoiosData.length === 0) {
        console.log('No new data from Koios');
        return supabaseData;
    }

    const latestKoiosTotal = latestKoiosData[0];

    // Check if we need to update the latest epoch
    const needsUpdate = Object.keys(latestKoiosTotal).some(key => {
        if (key === 'epoch_no') return false;
        return Number(latestKoiosTotal[key as keyof NetworkTotals]) !==
            Number(supabaseData[0][key as keyof NetworkTotals]);
    });

    if (needsUpdate) {
        console.log('Updating latest epoch data');
        await upsertNetworkTotals(latestKoiosData);
        return [latestKoiosTotal, ...supabaseData.slice(1)];
    }

    return supabaseData;
};

const fetchAndUpdateGovernanceProposals = async (): Promise<GovernanceProposal[]> => {
    // First, fetch all data from Supabase
    const supabaseData = await fetchGovernanceProposalsFromSupabase();

    if (supabaseData.length === 0) {
        // If no data in Supabase, fetch all from Koios
        const koiosData = await fetchGovernanceProposalsFromKoios();
        await upsertGovernanceProposals(koiosData);
        return koiosData;
    }

    // Fetch all proposals from Koios
    const koiosData = await fetchGovernanceProposalsFromKoios();

    // Find new or updated proposals
    const newOrUpdatedProposals = koiosData.filter(koiosProposal => {
        const existingProposal = supabaseData.find(p => p.proposal_id === koiosProposal.proposal_id);
        if (!existingProposal) return true; // New proposal

        // Check if any field has changed
        return Object.keys(koiosProposal).some(key => {
            if (key === 'created_at' || key === 'updated_at') return false;
            return JSON.stringify(koiosProposal[key as keyof GovernanceProposal]) !==
                JSON.stringify(existingProposal[key as keyof GovernanceProposal]);
        });
    });

    if (newOrUpdatedProposals.length > 0) {
        console.log('Updating governance proposals:', newOrUpdatedProposals.length);
        await upsertGovernanceProposals(newOrUpdatedProposals);

        // Merge the updated data with existing data
        const updatedData = [...supabaseData];
        newOrUpdatedProposals.forEach(proposal => {
            const index = updatedData.findIndex(p => p.proposal_id === proposal.proposal_id);
            if (index >= 0) {
                updatedData[index] = proposal;
            } else {
                updatedData.push(proposal);
            }
        });

        return updatedData.sort((a, b) => b.proposed_epoch - a.proposed_epoch);
    }

    return supabaseData;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();

    const networkTotalsQueryOptions: UseQueryOptions<NetworkTotals[], Error> = {
        queryKey: ['networkTotals'],
        queryFn: fetchAndUpdateNetworkTotals,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    };

    const governanceProposalsQueryOptions: UseQueryOptions<GovernanceProposal[], Error> = {
        queryKey: ['governanceProposals'],
        queryFn: fetchAndUpdateGovernanceProposals,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    };

    const {
        data: networkTotals = [],
        isLoading: loadingNetworkTotals,
        error: networkTotalsError,
        refetch: refreshNetworkTotals
    } = useQuery<NetworkTotals[], Error>(networkTotalsQueryOptions);

    const {
        data: governanceProposals = [],
        isLoading: loadingGovernanceProposals,
        error: governanceProposalsError,
        refetch: refreshGovernanceProposals
    } = useQuery<GovernanceProposal[], Error>(governanceProposalsQueryOptions);

    React.useEffect(() => {
        if (networkTotals.length > 0) {
            console.log('Processed Network Totals:', networkTotals);
        }
    }, [networkTotals]);

    React.useEffect(() => {
        if (governanceProposals.length > 0) {
            console.log('Processed Governance Proposals:', governanceProposals);
        }
    }, [governanceProposals]);

    const value: DataContextType = {
        networkTotals: networkTotals[0], // Get the latest totals for the context
        governanceProposals,
        loading: loadingNetworkTotals || loadingGovernanceProposals,
        error: (networkTotalsError || governanceProposalsError) as Error | null,
        lastUpdated: new Date(),
        refresh: async () => {
            console.log('Refreshing data...');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['networkTotals'] }),
                queryClient.invalidateQueries({ queryKey: ['governanceProposals'] })
            ]);
            console.log('Data refresh completed');
        },
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}; 