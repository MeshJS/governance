import { NetworkTotals } from './network';
import { GovernanceProposal } from './governance';
import { ChainTip } from './network';

export interface DataContextType {
    chainTip: ChainTip | undefined;
    networkTotals: NetworkTotals[];
    governanceProposals: GovernanceProposal[];
    loading: {
        chainTip: boolean;
        networkTotals: boolean;
        governanceProposals: boolean;
    };
    error: {
        chainTip: Error | null;
        networkTotals: Error | null;
        governanceProposals: Error | null;
    };
    isError: {
        chainTip: boolean;
        networkTotals: boolean;
        governanceProposals: boolean;
    };
    lastUpdated: Date;
    refresh: () => Promise<void>;
} 