import { BaseData } from './base';

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
    [key: string]: unknown;
}

export interface Deposit {
    return_address: string;
    [key: string]: unknown;
}

export interface VotingSummary {
    drep_yes_votes_cast: number;
    drep_active_yes_vote_power: string;
    drep_yes_vote_power: string;
    drep_yes_pct: number;
    drep_no_votes_cast: number;
    drep_active_no_vote_power: string;
    drep_no_vote_power: string;
    drep_no_pct: number;
    drep_abstain_votes_cast: number;
    drep_active_abstain_vote_power: string;
    drep_always_no_confidence_vote_power: string;
    drep_always_abstain_vote_power: string;
    pool_yes_votes_cast: number;
    pool_active_yes_vote_power: string;
    pool_yes_vote_power: string;
    pool_yes_pct: number;
    pool_no_votes_cast: number;
    pool_active_no_vote_power: string;
    pool_no_vote_power: string;
    pool_no_pct: number;
    pool_abstain_votes_cast: number;
    pool_active_abstain_vote_power: string;
    pool_passive_always_abstain_votes_assigned: number;
    pool_passive_always_abstain_vote_power: string;
    pool_passive_always_no_confidence_votes_assigned: number;
    pool_passive_always_no_confidence_vote_power: string;
    committee_yes_votes_cast: number;
    committee_yes_pct: number;
    committee_no_votes_cast: number;
    committee_no_pct: number;
    committee_abstain_votes_cast: number;
    [key: string]: unknown;
}

export interface MetaJsonBody {
    [key: string]: unknown;
}

export interface MetaJson {
    [key: string]: unknown;
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export interface ParameterProposal {
    parameter_name: string;
    parameter_value: string | number;
    explanation: string;
    [key: string]: unknown;
}

export interface ProposalDescription {
    tag: ProposalType;
    [key: string]: unknown;
}

export interface GovernanceProposal extends BaseData {
    proposal_id: string;
    block_time: number;
    proposal_tx_hash: string;
    proposal_index: number;
    proposal_type: ProposalType;
    proposal_description: ProposalDescription;
    deposit: string;
    return_address: string;
    proposed_epoch: number;
    ratified_epoch: number | null;
    enacted_epoch: number | null;
    dropped_epoch: number | null;
    expired_epoch: number | null;
    expiration: number | null;
    meta_url: string | null;
    meta_hash: string | null;
    meta_json: MetaJson | null;
    meta_comment: string | null;
    meta_language: string | null;
    meta_is_valid: boolean | null;
    withdrawal: Withdrawal | null;
    param_proposal: ParameterProposal | null;
    title: string;
    description: string;
    status: string;
    voting_start_epoch: number;
    voting_end_epoch: number;
    voting_power: number;
    votes_yes: number;
    votes_no: number;
    votes_abstain: number;
    // Voting summary fields
    drep_yes_votes_cast?: number;
    drep_active_yes_vote_power?: string;
    drep_yes_vote_power?: string;
    drep_yes_pct?: number;
    drep_no_votes_cast?: number;
    drep_active_no_vote_power?: string;
    drep_no_vote_power?: string;
    drep_no_pct?: number;
    drep_abstain_votes_cast?: number;
    drep_active_abstain_vote_power?: string;
    drep_always_no_confidence_vote_power?: string;
    drep_always_abstain_vote_power?: string;
    pool_yes_votes_cast?: number;
    pool_active_yes_vote_power?: string;
    pool_yes_vote_power?: string;
    pool_yes_pct?: number;
    pool_no_votes_cast?: number;
    pool_active_no_vote_power?: string;
    pool_no_vote_power?: string;
    pool_no_pct?: number;
    pool_abstain_votes_cast?: number;
    pool_active_abstain_vote_power?: string;
    pool_passive_always_abstain_votes_assigned?: number;
    pool_passive_always_abstain_vote_power?: string;
    pool_passive_always_no_confidence_votes_assigned?: number;
    pool_passive_always_no_confidence_vote_power?: string;
    committee_yes_votes_cast?: number;
    committee_yes_pct?: number;
    committee_no_votes_cast?: number;
    committee_no_pct?: number;
    committee_abstain_votes_cast?: number;
    [key: string]: unknown;
}

export type GovernanceProposalResponse = GovernanceProposal[];
export type VotingSummaryResponse = VotingSummary[]; 