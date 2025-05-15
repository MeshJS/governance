import { NetworkTotals } from './network';
import { GovernanceProposal } from './governance';

export interface WithdrawalRecord {
    id: string;
    submission_epoch: number;
    approval_epoch: number;
    expiration_epoch: number;
    amount: number;
    proposer_address: string;
    purpose: string;
    tx_hash: string;
}

export interface DataContextType {
    networkTotals?: NetworkTotals;
    governanceProposals: GovernanceProposal[];
    loading: boolean;
    error: Error | null;
    lastUpdated: Date;
    refresh: () => Promise<void>;
} 