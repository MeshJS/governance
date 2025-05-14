import styles from './SummaryCards.module.css';
import React from 'react';
import { WithdrawalRecord } from '@/contexts/DataContext';

function formatAda(amount: number) {
    return `₳${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export default function SummaryCards({ withdrawals, loading }: { withdrawals: WithdrawalRecord[]; loading: boolean }) {
    const total = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    return (
        <div className={styles.row}>
            <div className={styles.card}>
                <div className={styles.label}>Total Withdrawn</div>
                <div className={styles.value}>{loading ? <div className={styles.skel} /> : formatAda(total)}</div>
            </div>
            <div className={styles.card}>
                <div className={styles.label}>Approved Requests</div>
                <div className={styles.value}>{loading ? <div className={styles.skel} /> : withdrawals.length}</div>
            </div>
        </div>
    );
} 