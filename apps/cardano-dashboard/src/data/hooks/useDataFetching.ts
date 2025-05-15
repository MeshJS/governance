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

    const chainTipQueryOptions: UseQueryOptions<ChainTip, Error> = {
        queryKey: ['chainTip'],
        queryFn: () => chainTipApi.fetchAndUpdate(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    };

    const {
        data: chainTip,
        isLoading: loadingChainTip,
        error: chainTipError,
    } = useQuery<ChainTip, Error>(chainTipQueryOptions);

    const networkTotalsQueryOptions: UseQueryOptions<NetworkTotals[], Error> = {
        queryKey: ['networkTotals'],
        queryFn: () => networkTotalsApi.fetchAndUpdate(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    };

    const governanceProposalsQueryOptions: UseQueryOptions<GovernanceProposal[], Error> = {
        queryKey: ['governanceProposals'],
        queryFn: () => governanceProposalsApi.fetchAndUpdate(chainTip as ChainTip),
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        enabled: !!chainTip, // Only run when we have chain tip data
    };

    const {
        data: networkTotals = [],
        isLoading: loadingNetworkTotals,
        error: networkTotalsError,
    } = useQuery<NetworkTotals[], Error>(networkTotalsQueryOptions);

    const {
        data: governanceProposals = [],
        isLoading: loadingGovernanceProposals,
        error: governanceProposalsError,
    } = useQuery<GovernanceProposal[], Error>(governanceProposalsQueryOptions);

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
        loading: loadingChainTip || loadingNetworkTotals || loadingGovernanceProposals,
        error: (chainTipError || networkTotalsError || governanceProposalsError) as Error | null,
        lastUpdated: new Date(),
        refresh,
    };
} 