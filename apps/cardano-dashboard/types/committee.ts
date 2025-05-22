export interface CommitteeMember {
    status: string;
    cc_hot_id: string;
    cc_cold_id: string;
    cc_hot_hex: string;
    cc_cold_hex: string;
    expiration_epoch: number;
    cc_hot_has_script: boolean;
    cc_cold_has_script: boolean;
    proposal_id?: string | null;
    proposal_tx_hash?: string | null;
    proposal_index?: number | null;
    quorum_numerator?: number;
    quorum_denominator?: number;
    votes?: CommitteeVote[];
    updated_at?: string;
}

export interface CommitteeVote {
    proposal_id: string;
    proposal_tx_hash: string;
    proposal_index: number;
    vote_tx_hash: string;
    block_time: number;
    vote: 'Yes' | 'No' | 'Abstain';
    meta_url: string | null;
    meta_hash: string | null;
} 