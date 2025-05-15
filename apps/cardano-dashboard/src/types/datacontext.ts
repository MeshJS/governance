import { NetworkTotals } from './network';
import { GovernanceProposal } from './governance';
export interface DataContextType {
    networkTotals: NetworkTotals[];
    governanceProposals: GovernanceProposal[];
    loading: boolean;
    error: Error | null;
    lastUpdated: Date;
    refresh: () => Promise<void>;
} 