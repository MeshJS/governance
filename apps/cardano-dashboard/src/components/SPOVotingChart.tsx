import React from 'react';
import VotingChart from './VotingChart';
import { GovernanceProposal } from '../../types/governance';

interface SPOVotingChartProps {
    proposals: GovernanceProposal[];
}

export default function SPOVotingChart({ proposals }: SPOVotingChartProps) {
    return <VotingChart type="spo" proposals={proposals} />;
} 