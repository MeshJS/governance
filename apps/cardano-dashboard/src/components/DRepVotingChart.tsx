import React from 'react';
import VotingChart from './VotingChart';
import { GovernanceProposal } from '../../types/governance';

interface DRepVotingChartProps {
    proposals: GovernanceProposal[];
}

export default function DRepVotingChart({ proposals }: DRepVotingChartProps) {
    return <VotingChart type="drep" proposals={proposals} />;
}