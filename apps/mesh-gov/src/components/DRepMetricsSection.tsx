import styles from './DRepMetricsSection.module.css';

interface DRepMetricsSectionProps {
  totalDelegators: number;
  totalAdaDelegated: number;
  totalVotedProposals: number;
  votingParticipationRate: number;
}

export default function DRepMetricsSection({
  totalDelegators,
  totalAdaDelegated,
  totalVotedProposals,
  votingParticipationRate,
}: DRepMetricsSectionProps) {
  const formatAda = (amount: number) => {
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  return (
    <div className={styles.metricsSection}>
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{totalDelegators.toLocaleString()}</div>
          <div className={styles.metricLabel}>Total Delegators</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>₳{formatAda(totalAdaDelegated)}</div>
          <div className={styles.metricLabel}>Total ADA Delegated</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{totalVotedProposals}</div>
          <div className={styles.metricLabel}>Proposals Voted</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>Constant</div>
          <div className={styles.metricLabel}>Voting Participation</div>
        </div>
      </div>
    </div>
  );
}
