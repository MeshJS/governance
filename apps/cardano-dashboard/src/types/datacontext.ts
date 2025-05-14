export interface WithdrawalRecord {
    id: string; // proposal_id
    submission_date: string;
    approval_date: string;
    expiration_date: string;
    amount: number;
    proposer_address: string;
    purpose: string;
    tx_hash: string;
}

export interface DataContextType {
    withdrawals: WithdrawalRecord[];
    loading: boolean;
    error: Error | null;
    lastUpdated: Date | null;
    refresh: () => Promise<void>;
} 