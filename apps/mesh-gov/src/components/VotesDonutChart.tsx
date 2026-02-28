import { useCallback, useMemo, useState } from 'react';
import CanvasDonutChart, { GradientStop } from './CanvasDonutChart';
import styles from '../styles/Proposals.module.css';
import { CatalystProject } from '../types';

interface VotesDonutChartProps {
  proposals: CatalystProject[];
}

const GRADIENT: GradientStop[] = [
  { offset: 0, color: 'rgba(0, 0, 0, 0.95)' },
  { offset: 0.4, color: 'rgba(30, 41, 59, 0.9)' },
  { offset: 0.8, color: 'rgba(71, 85, 105, 0.85)' },
  { offset: 1, color: 'rgba(148, 163, 184, 0.8)' },
];
const HOVER_GRADIENT: GradientStop[] = [
  { offset: 0, color: 'rgba(30, 41, 59, 1)' },
  { offset: 0.4, color: 'rgba(51, 65, 85, 0.95)' },
  { offset: 0.8, color: 'rgba(100, 116, 139, 0.9)' },
  { offset: 1, color: 'rgba(148, 163, 184, 0.85)' },
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
  const [activeKey, setActiveKey] = useState<string | null>(null);

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

  const totalVotes = useMemo(
    () => proposalsWithVotes.reduce((sum, p) => sum + p.votes, 0),
    [proposalsWithVotes]
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

  const activeProposal = useMemo(
    () => (activeKey ? proposalsWithVotes.find(p => p.id === activeKey) : null),
    [activeKey, proposalsWithVotes]
  );

  const handleActiveChange = useCallback((key: string | null) => {
    setActiveKey(key);
  }, []);

  // Use a compact "Total Votes" + hover tooltip legend instead of listing all proposals
  const legend = useMemo(
    () => [
      {
        key: '__total__',
        label: 'Total Votes',
        formattedValue: formatNumber(totalVotes),
        colorClassName: `${styles.legendColor} ${styles.distributed}`,
      },
      ...(activeProposal
        ? [
            {
              key: activeProposal.id,
              label: `${activeProposal.fund} - ${activeProposal.title.length > 30 ? activeProposal.title.substring(0, 30) + '...' : activeProposal.title}`,
              formattedValue: formatNumber(activeProposal.votes),
              colorClassName: `${styles.legendColor} ${styles.distributed}`,
            },
          ]
        : []),
    ],
    [totalVotes, activeProposal]
  );

  return (
    <CanvasDonutChart
      segments={segments}
      legend={legend}
      styles={styles}
      showStrokes
      onActiveSegmentChange={handleActiveChange}
    />
  );
};

export default VotesDonutChart;
