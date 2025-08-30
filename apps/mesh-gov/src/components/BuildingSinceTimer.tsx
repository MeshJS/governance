import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import styles from './BuildingSinceTimer.module.css';

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

function findFirstContributionDate(contributorStats: any): Date {
  if (!contributorStats?.contributors) {
    return new Date('2021-01-01'); // Fallback date
  }

  let earliestDate = new Date();
  contributorStats.contributors.forEach((contributor: any) => {
    contributor.repositories.forEach((repo: any) => {
      const timestamps = [...(repo.commit_timestamps || []), ...(repo.pr_timestamps || [])];
      timestamps.forEach((timestamp: string) => {
        const date = new Date(timestamp);
        if (date < earliestDate) {
          earliestDate = date;
        }
      });
    });
  });

  return earliestDate;
}

export function BuildingSinceTimer() {
  const { contributorStats, loadContributorStats } = useData();
  const [time, setTime] = useState<TimeUnits>({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [firstDate, setFirstDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!contributorStats) {
      loadContributorStats();
    } else {
      const date = findFirstContributionDate(contributorStats);
      setFirstDate(date);
    }
  }, [contributorStats, loadContributorStats]);

  useEffect(() => {
    if (!firstDate) return;

    const timer = setInterval(() => {
      setTime(calculateTimeDifference(firstDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [firstDate]);

  if (!firstDate) {
    return null;
  }

  return (
    <div className={styles.timerContainer}>
      <h3 className={styles.timerTitle}>Building on Cardano since</h3>
      <div className={styles.timerUnits}>
        <div className={styles.unit}>
          <span className={styles.value}>{time.years}</span>
          <span className={styles.label}>years</span>
        </div>
        <div className={styles.unit}>
          <span className={styles.value}>{time.days}</span>
          <span className={styles.label}>days</span>
        </div>
        <div className={styles.unit}>
          <span className={styles.value}>{time.hours}</span>
          <span className={styles.label}>hours</span>
        </div>
        <div className={styles.unit}>
          <span className={styles.value}>{time.minutes}</span>
          <span className={styles.label}>minutes</span>
        </div>
        <div className={styles.unit}>
          <span className={styles.value}>{time.seconds}</span>
          <span className={styles.label}>seconds</span>
        </div>
      </div>
    </div>
  );
}
