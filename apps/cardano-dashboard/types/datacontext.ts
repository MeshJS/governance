import { ChainTip, NetworkTotals } from './network';
import { GovernanceProposal } from './governance';
import { SPOData } from './spo';
import { DRepDetailedData } from './drep';
import { CommitteeMember } from './committee';

export interface DataContextType {
    chainTip: ChainTip[];
    networkTotals: NetworkTotals[];
    governanceProposals: GovernanceProposal[];
    spoData: SPOData[];
    drepData: DRepDetailedData[];
    committeeData: CommitteeMember[];
    loading: {
        chainTip: boolean;
        networkTotals: boolean;
        governanceProposals: boolean;
        spoData: boolean;
        drepData: boolean;
        committeeData: boolean;
    };
    error: {
        chainTip: Error | null;
        networkTotals: Error | null;
        governanceProposals: Error | null;
        spoData: Error | null;
        drepData: Error | null;
        committeeData: Error | null;
    };
    isError: {
        chainTip: boolean;
        networkTotals: boolean;
        governanceProposals: boolean;
        spoData: boolean;
        drepData: boolean;
        committeeData: boolean;
    };
    lastUpdated: Date;
    refresh: () => Promise<void>;
} 