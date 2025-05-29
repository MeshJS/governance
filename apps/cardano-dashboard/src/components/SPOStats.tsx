import React from 'react';
import styles from '@/styles/SPOStats.module.css';

interface SPOStatsProps {
    spoData: Array<{
        live_delegators?: number;
        live_stake?: string | number;
    }>;
}

export default function SPOStats({ spoData }: SPOStatsProps) {
    // Always render the same structure, just with different values
    const totalSPOs = spoData?.length || 0;
    const totalDelegators = spoData?.reduce((sum, spo) => sum + (spo.live_delegators || 0), 0) || 0;
    const totalLiveStake = spoData?.reduce((sum, spo) => {
        const stake = spo.live_stake;
        if (typeof stake === 'string') {
            return sum + (parseFloat(stake) || 0);
        }
        return sum + (stake || 0);
    }, 0) || 0;

    return (
        <div className={styles.statsContainer}>
            <div className={styles.statCard}>
                <h3>Total SPOs</h3>
                <div className={styles.statValue}>
                    {totalSPOs > 0 ? totalSPOs.toLocaleString() : '-'}
                </div>
            </div>
            <div className={styles.statCard}>
                <h3>Total Delegators</h3>
                <div className={styles.statValue}>
                    {totalDelegators > 0 ? totalDelegators.toLocaleString() : '-'}
                </div>
            </div>
            <div className={styles.statCard}>
                <h3>Total Live Stake</h3>
                <div className={styles.statValue}>
                    {totalLiveStake > 0
                        ? `₳ ${(totalLiveStake / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '-'
                    }
                </div>
            </div>
        </div>
    );
} 