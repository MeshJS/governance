// hooks/useDataFetching.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NetworkTotalsApi } from '../api/networkTotalsApi';
import { GovernanceProposalsApi } from '../api/governanceProposalsApi';
import { ChainTipApi } from '../api/chainTipApi';
import { NetworkTotals } from 'types/network';
import { GovernanceProposal } from 'types/governance';
import { ChainTip } from 'types/network';

const networkTotalsApi = new NetworkTotalsApi();
const governanceProposalsApi = new GovernanceProposalsApi();
const chainTipApi = new ChainTipApi();

const RETRY_CONFIG = {
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
};

export function useDataFetching() {
    const queryClient = useQueryClient();

    // Chain Tip Query
    const {
        data: chainTip,
        isLoading: loadingChainTip,
        error: chainTipError,
        isError: isChainTipError
    } = useQuery<ChainTip | undefined, Error>({
        queryKey: ['chainTip'],
        queryFn: async () => {
            try {
                return await chainTipApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching chain tip:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG
    });

    // Network Totals Query
    const {
        data: networkTotals = [],
        isLoading: loadingNetworkTotals,
        error: networkTotalsError,
        isError: isNetworkTotalsError
    } = useQuery<NetworkTotals[], Error>({
        queryKey: ['networkTotals'],
        queryFn: async () => {
            try {
                return await networkTotalsApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching network totals:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG
    });

    // Governance Proposals Query
    const {
        data: governanceProposals = [],
        isLoading: loadingGovernanceProposals,
        error: governanceProposalsError,
        isError: isGovernanceProposalsError
    } = useQuery<GovernanceProposal[], Error>({
        queryKey: ['governanceProposals'],
        queryFn: async () => {
            try {
                return await governanceProposalsApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching governance proposals:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG
    });

    const refresh = async () => {
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['chainTip'] }),
                queryClient.invalidateQueries({ queryKey: ['networkTotals'] }),
                queryClient.invalidateQueries({ queryKey: ['governanceProposals'] })
            ]);
        } catch (error) {
            console.error('Error refreshing data:', error);
            throw error;
        }
    };

    return {
        chainTip,
        networkTotals,
        governanceProposals,
        loading: {
            chainTip: loadingChainTip,
            networkTotals: loadingNetworkTotals,
            governanceProposals: loadingGovernanceProposals
        },
        error: {
            chainTip: chainTipError,
            networkTotals: networkTotalsError,
            governanceProposals: governanceProposalsError
        },
        isError: {
            chainTip: isChainTipError,
            networkTotals: isNetworkTotalsError,
            governanceProposals: isGovernanceProposalsError
        },
        lastUpdated: new Date(),
        refresh,
    };
} 