// hooks/useDataFetching.ts
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { NetworkTotalsApi } from '../api/networkTotalsApi';
import { GovernanceProposalsApi } from '../api/governanceProposalsApi';
import { ChainTipApi } from '../api/chainTipApi';
import { NetworkTotals } from '../../types/network';
import { GovernanceProposal } from '../../types/governance';
import { ChainTip } from '../../types/network';

const networkTotalsApi = new NetworkTotalsApi();
const governanceProposalsApi = new GovernanceProposalsApi();
const chainTipApi = new ChainTipApi();

export function useDataFetching() {
    const queryClient = useQueryClient();

    // Chain Tip Query - Independent
    const {
        data: chainTip,
        isLoading: loadingChainTip,
        error: chainTipError,
    } = useQuery<ChainTip, Error>({
        queryKey: ['chainTip'],
        queryFn: () => chainTipApi.fetchAndUpdate(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    // Network Totals Query - Independent
    const {
        data: networkTotals = [],
        isLoading: loadingNetworkTotals,
        error: networkTotalsError,
    } = useQuery<NetworkTotals[], Error>({
        queryKey: ['networkTotals'],
        queryFn: () => networkTotalsApi.fetchAndUpdate(),
        staleTime: 1 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });

    // Governance Proposals Query - Can use chain tip if available, but doesn't wait for it
    const {
        data: governanceProposals = [],
        isLoading: loadingGovernanceProposals,
        error: governanceProposalsError,
    } = useQuery<GovernanceProposal[], Error>({
        queryKey: ['governanceProposals', chainTip?.slot_no],
        queryFn: () => governanceProposalsApi.fetchAndUpdate(chainTip as ChainTip),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes to get enriched data
    });

    const refresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['chainTip'] }),
            queryClient.invalidateQueries({ queryKey: ['networkTotals'] }),
            queryClient.invalidateQueries({ queryKey: ['governanceProposals'] })
        ]);
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
        error: (chainTipError || networkTotalsError || governanceProposalsError) as Error | null,
        lastUpdated: new Date(),
        refresh,
    };
} 