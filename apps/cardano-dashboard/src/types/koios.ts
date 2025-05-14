// Type for Koios proposal object
export interface KoiosProposal {
    block_time: number;
    deposit?: string;
    dropped_epoch?: number | null;
    enacted_epoch?: number | null;
    expiration?: number | null;
    expired_epoch?: number | null;
    meta_comment?: string | null;
    meta_hash?: string | null;
    meta_is_valid?: boolean | null;
    meta_json?: any;
    meta_language?: string | null;
    meta_url?: string | null;
    param_proposal?: any;
    proposal_description?: any;
    proposal_id: string;
    proposal_index: number;
    proposal_tx_hash: string;
    proposal_type: string;
    proposed_epoch: number;
    ratified_epoch?: number | null;
    return_address?: string | null;
    withdrawal?: {
        amount?: string | null;
        stake_address?: string | null;
    } | null;
} 