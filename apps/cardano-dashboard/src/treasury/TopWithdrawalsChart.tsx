import React from 'react';
import { WithdrawalRecord } from '@/contexts/DataContext';
import styles from './TopWithdrawalsChart.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

function formatAda(amount: number) {
    return `₳${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatDate(epoch: string) {
    if (!epoch) return '-';
    const d = new Date(Number(epoch) * 1000);
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TopWithdrawalsChart({ withdrawals, loading }: { withdrawals: WithdrawalRecord[]; loading: boolean }) {
    const top5 = [...withdrawals]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(w => ({
            ...w,
            label: w.id,
        }));
    return (
        <div className={styles.chartCard}>
            <div className={styles.title}>Top 5 Largest Withdrawals</div>
            {loading ? (
                <div className={styles.skel} />
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={top5} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="label" stroke="#aaa" />
                        <YAxis tickFormatter={v => formatAda(v)} stroke="#aaa" />
                        <Tooltip
                            formatter={v => formatAda(Number(v))}
                            labelFormatter={(_, i) =>
                                `Proposal ID: ${top5[i]?.id}\nApproval: ${formatDate(top5[i]?.approval_date)}`
                            }
                            labelClassName={styles.tooltipLabel}
                        />
                        <Legend />
                        <Bar dataKey="amount" fill="#14b8a6" name="Amount" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
} 