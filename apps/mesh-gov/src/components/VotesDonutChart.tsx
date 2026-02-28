import { useMemo } from 'react';
import CanvasDonutChart from './CanvasDonutChart';
import styles from '../styles/Proposals.module.css';
import { CatalystProject } from '../types';

interface VotesDonutChartProps {
  proposals: CatalystProject[];
}

const GRADIENT = [
  'rgba(0, 0, 0, 0.95)',
  'rgba(30, 41, 59, 0.9)',
  'rgba(71, 85, 105, 0.85)',
  'rgba(148, 163, 184, 0.8)',
];
const HOVER_GRADIENT = [
  'rgba(30, 41, 59, 1)',
  'rgba(51, 65, 85, 0.95)',
  'rgba(100, 116, 139, 0.9)',
  'rgba(148, 163, 184, 0.85)',
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getFundingRound = (category: string): string => {
  return category.trim().substring(0, 3);
};

const VotesDonutChart = ({ proposals }: VotesDonutChartProps) => {
  const proposalsWithVotes = useMemo(
    () =>
      proposals
        .map(p => ({
          id: p.projectDetails.id.toString(),
          title: p.projectDetails.title,
          fund: getFundingRound(p.projectDetails.category),
          votes: p.projectDetails.voting?.yes_votes_count || 0,
        }))
        .filter(p => p.votes > 0)
        .sort((a, b) => b.votes - a.votes),
    [proposals]
  );

  const segments = useMemo(
    () =>
      proposalsWithVotes.map(p => ({
        key: p.id,
        value: p.votes,
        label: p.title,
        gradientStops: GRADIENT,
        hoverGradientStops: HOVER_GRADIENT,
      })),
    [proposalsWithVotes]
  );

  const legend = useMemo(
    () =>
      proposalsWithVotes.map(p => ({
        key: p.id,
        label: `${p.fund} - ${p.title}`,
        formattedValue: formatNumber(p.votes),
      })),
    [proposalsWithVotes]
  );

  return (
    <CanvasDonutChart segments={segments} legend={legend} styles={styles} showStrokes />
  );
};

export default VotesDonutChart;
