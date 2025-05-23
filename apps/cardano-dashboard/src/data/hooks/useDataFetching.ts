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

export function useDataFetching() {
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
        ...RETRY_CONFIG
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
        ...RETRY_CONFIG
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
        ...RETRY_CONFIG
    });

    const refresh = async () => {
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['chainTip'] }),
                queryClient.invalidateQueries({ queryKey: ['networkTotals'] }),
                queryClient.invalidateQueries({ queryKey: ['governanceProposals'] }),
                queryClient.invalidateQueries({ queryKey: ['spoData'] }),
                queryClient.invalidateQueries({ queryKey: ['drepData'] }),
                queryClient.invalidateQueries({ queryKey: ['committeeData'] })
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