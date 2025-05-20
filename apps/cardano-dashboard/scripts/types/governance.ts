export interface GovernanceProposal {
    proposal_id: string;
    title: string;
    description: string;
    expiration: number;
    created_at: string;
    updated_at: string;
}

export type GovernanceProposalResponse = GovernanceProposal[];

export interface VotingSummary {
    proposal_id: string;
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
    total_votes: number;
}

export type VotingSummaryResponse = VotingSummary[]; 