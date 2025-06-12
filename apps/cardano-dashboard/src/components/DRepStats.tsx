import React from 'react';
import styles from '@/styles/SPOStats.module.css';

interface DRepStatsProps {
    drepData: Array<{
        total_delegators?: number;
        amount?: string | number;
    }>;
}

export default function DRepStats({ drepData }: DRepStatsProps) {
    const totalDReps = drepData?.length || 0;
    const totalDelegators = drepData?.reduce((sum, drep) => sum + (drep.total_delegators || 0), 0) || 0;
    const totalDelegatedAda = drepData?.reduce((sum, drep) => {
        const amount = drep.amount;
        if (typeof amount === 'string') {
            return sum + (parseFloat(amount) || 0);
        }
        return sum + (amount || 0);
    }, 0) || 0;

    return (
        <div className={styles.statsContainer}>
            <div className={styles.statCard}>
                <h3>Total Active DReps</h3>
                <div className={styles.statValue}>
                    {totalDReps > 0 ? totalDReps.toLocaleString() : '-'}
                </div>
            </div>
            <div className={styles.statCard}>
                <h3>Total Delegators to Active Dreps</h3>
                <div className={styles.statValue}>
                    {totalDelegators > 0 ? totalDelegators.toLocaleString() : '-'}
                </div>
            </div>
            <div className={styles.statCard}>
                <h3>Total Active Delegated ADA</h3>
                <div className={styles.statValue}>
                    {totalDelegatedAda > 0
                        ? `₳ ${(totalDelegatedAda / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '-'}
                </div>
            </div>
        </div>
    );
} 