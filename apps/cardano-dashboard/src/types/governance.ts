export type ProposalType =
    | 'ParameterChange'
    | 'HardForkInitiation'
    | 'TreasuryWithdrawals'
    | 'NoConfidence'
    | 'NewCommittee'
    | 'NewConstitution'
    | 'InfoAction';

export interface Withdrawal {
    stake_address: string;
    amount: string;
}

export interface Deposit {
    return_address: string;
}

export interface GovernanceProposal {
    proposal_id: string;
    block_time: number;
    proposal_tx_hash: string;
    proposal_index: number;
    proposal_type: ProposalType;
    proposal_description: any;
    deposit: Deposit | null;
    return_address: string | null;
    proposed_epoch: number;
    ratified_epoch: number | null;
    enacted_epoch: number | null;
    dropped_epoch: number | null;
    expired_epoch: number | null;
    expiration: number | null;
    meta_url: string | null;
    meta_hash: string | null;
    meta_json: any | null;
    meta_comment: string | null;
    meta_language: string | null;
    meta_is_valid: boolean | null;
    withdrawal: Withdrawal | null;
    param_proposal: any | null;
}

export interface GovernanceProposalResponse extends Array<GovernanceProposal> { } 