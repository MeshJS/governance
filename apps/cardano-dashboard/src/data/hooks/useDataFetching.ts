// hooks/useDataFetching.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NetworkTotalsApi } from '../api/networkTotalsApi';
import { GovernanceProposalsApi } from '../api/governanceProposalsApi';
import { ChainTipApi } from '../api/chainTipApi';
import { SPODataApi } from '../api/spoDataApi';
import { DRepDataApi } from '../api/drepDataApi';
import { CommitteeDataApi } from '../api/committeeDataApi';
import { NetworkTotals, ChainTip } from '../../../types/network';
import { GovernanceProposal } from '../../../types/governance';
import { SPOData } from '../../../types/spo';
import { DRepDetailedData } from '../../../types/drep';
import { CommitteeMember } from '../../../types/committee';

const networkTotalsApi = new NetworkTotalsApi();
const governanceProposalsApi = new GovernanceProposalsApi();
const chainTipApi = new ChainTipApi();
const spoDataApi = new SPODataApi();
const drepDataApi = new DRepDataApi();
const committeeDataApi = new CommitteeDataApi();

const RETRY_CONFIG = {
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
};

type DataFetchingOptions = {
    fetchChainTip?: boolean;
    fetchNetworkTotals?: boolean;
    fetchGovernanceProposals?: boolean;
    fetchSPOData?: boolean;
    fetchDRepData?: boolean;
    fetchCommitteeData?: boolean;
};

export function useDataFetching(options: DataFetchingOptions = {}) {
    const queryClient = useQueryClient();

    // Chain Tip Query
    const {
        data: chainTip = [],
        isLoading: loadingChainTip,
        error: chainTipError,
        isError: isChainTipError
    } = useQuery<ChainTip[], Error>({
        queryKey: ['chainTip'],
        queryFn: async () => {
            try {
                return await chainTipApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching chain tip:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG,
        enabled: options.fetchChainTip ?? false
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
        ...RETRY_CONFIG,
        enabled: options.fetchNetworkTotals ?? false
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
        ...RETRY_CONFIG,
        enabled: options.fetchGovernanceProposals ?? false
    });

    // SPO Data Query
    const {
        data: spoData = [],
        isLoading: loadingSPOData,
        error: spoDataError,
        isError: isSPODataError
    } = useQuery<SPOData[], Error>({
        queryKey: ['spoData'],
        queryFn: async () => {
            try {
                return await spoDataApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching SPO data:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG,
        enabled: options.fetchSPOData ?? false
    });

    // DRep Data Query
    const {
        data: drepData = [],
        isLoading: loadingDRepData,
        error: drepDataError,
        isError: isDRepDataError
    } = useQuery<DRepDetailedData[], Error>({
        queryKey: ['drepData'],
        queryFn: async () => {
            try {
                return await drepDataApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching DRep data:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG,
        enabled: options.fetchDRepData ?? false
    });

    // Committee Data Query
    const {
        data: committeeData = [],
        isLoading: loadingCommitteeData,
        error: committeeDataError,
        isError: isCommitteeDataError
    } = useQuery<CommitteeMember[], Error>({
        queryKey: ['committeeData'],
        queryFn: async () => {
            try {
                return await committeeDataApi.fetchAndUpdate();
            } catch (error) {
                console.error('Error fetching committee data:', error);
                throw error;
            }
        },
        ...RETRY_CONFIG,
        enabled: options.fetchCommitteeData ?? false
    });

    const refresh = async () => {
        try {
            const queriesToInvalidate = [];
            if (options.fetchChainTip) queriesToInvalidate.push(['chainTip']);
            if (options.fetchNetworkTotals) queriesToInvalidate.push(['networkTotals']);
            if (options.fetchGovernanceProposals) queriesToInvalidate.push(['governanceProposals']);
            if (options.fetchSPOData) queriesToInvalidate.push(['spoData']);
            if (options.fetchDRepData) queriesToInvalidate.push(['drepData']);
            if (options.fetchCommitteeData) queriesToInvalidate.push(['committeeData']);

            await Promise.all(
                queriesToInvalidate.map(queryKey =>
                    queryClient.invalidateQueries({ queryKey })
                )
            );
        } catch (error) {
            console.error('Error refreshing data:', error);
            throw error;
        }
    };

    return {
        chainTip,
        networkTotals,
        governanceProposals,
        spoData,
        drepData,
        committeeData,
        loading: {
            chainTip: loadingChainTip,
            networkTotals: loadingNetworkTotals,
            governanceProposals: loadingGovernanceProposals,
            spoData: loadingSPOData,
            drepData: loadingDRepData,
            committeeData: loadingCommitteeData
        },
        error: {
            chainTip: chainTipError,
            networkTotals: networkTotalsError,
            governanceProposals: governanceProposalsError,
            spoData: spoDataError,
            drepData: drepDataError,
            committeeData: committeeDataError
        },
        isError: {
            chainTip: isChainTipError,
            networkTotals: isNetworkTotalsError,
            governanceProposals: isGovernanceProposalsError,
            spoData: isSPODataError,
            drepData: isDRepDataError,
            committeeData: isCommitteeDataError
        },
        lastUpdated: new Date(),
        refresh,
    };
} 