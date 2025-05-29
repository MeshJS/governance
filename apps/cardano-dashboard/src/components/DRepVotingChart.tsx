import React from 'react';
import VotingChart from './VotingChart';

interface DRepVotingChartProps {
    proposals: Array<{
        proposal_id: string;
        meta_json: {
            body?: {
                title?: string;
            };
        } | null;
        drep_yes_votes_cast: number;
        drep_no_votes_cast: number;
        drep_abstain_votes_cast: number;
        drep_yes_vote_power: string | number;
        drep_no_vote_power: string | number;
        drep_active_abstain_vote_power: string | number;
    }>;
}

export default function DRepVotingChart({ proposals }: DRepVotingChartProps) {
    return <VotingChart type="drep" proposals={proposals} />;
}