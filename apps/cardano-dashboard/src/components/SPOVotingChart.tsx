import React from 'react';
import VotingChart from './VotingChart';

interface SPOVotingChartProps {
    proposals: Array<{
        proposal_id: string;
        meta_json: {
            body?: {
                title?: string;
            };
        } | null;
        pool_yes_votes_cast: number;
        pool_no_votes_cast: number;
        pool_abstain_votes_cast: number;
        pool_yes_vote_power: string | number;
        pool_no_vote_power: string | number;
        pool_active_abstain_vote_power: string | number;
    }>;
}

export default function SPOVotingChart({ proposals }: SPOVotingChartProps) {
    return <VotingChart type="spo" proposals={proposals} />;
} 