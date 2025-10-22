import styles from './DRepMetricsSection.module.css';
import { useEffect, useState } from 'react';

interface DRepMetricsSectionProps {
  totalDelegators: number;
  totalAdaDelegated: number;
  totalVotedProposals: number;
  votingParticipationRate?: number;
  startDate?: Date;
}

interface TimeUnits {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeDifference(startDate: Date): TimeUnits {
  const now = new Date();
  const diff = now.getTime() - startDate.getTime();

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) % 365;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));

  return { years, days, hours, minutes, seconds };
}

export default function DRepMetricsSection({
  totalDelegators,
  totalAdaDelegated,
  totalVotedProposals,
  startDate = new Date('2024-11-09'),
}: DRepMetricsSectionProps) {
  const [time, setTime] = useState<TimeUnits>(calculateTimeDifference(startDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTimeDifference(startDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  const formatAda = (amount: number) => {
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1_000) {
      return `${(amount / 1_000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
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
          <div className={styles.activeTime}>
            <div className={styles.timeUnit}>
              <span className={styles.timeValue}>{time.years}</span>
              <span className={styles.timeLabel}>y</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeValue}>{time.days}</span>
              <span className={styles.timeLabel}>d</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeValue}>{time.hours}</span>
              <span className={styles.timeLabel}>h</span>
            </div>
          </div>
          <div className={styles.metricLabel}>Active DRep Since</div>
        </div>
      </div>
    </div>
  );
}
