import React from 'react';
import { WithdrawalRecord } from '@/contexts/DataContext';
import styles from './MonthlyTrendChart.module.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

function formatAda(amount: number) {
    return `₳${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function getMonthlyData(withdrawals: WithdrawalRecord[]) {
    const now = new Date();
    const months: { [k: string]: number } = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        months[key] = 0;
    }
    withdrawals.forEach(w => {
        const d = new Date(Number(w.approval_date) * 1000);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        if (months[key] !== undefined) months[key] += w.amount;
    });
    return Object.entries(months).map(([k, v]) => {
        const [year, month] = k.split('-');
        return {
            name: `${new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })}`,
            amount: v,
        };
    });
}

export default function MonthlyTrendChart({ withdrawals, loading }: { withdrawals: WithdrawalRecord[]; loading: boolean }) {
    const data = getMonthlyData(withdrawals);
    return (
        <div className={styles.chartCard}>
            <div className={styles.title}>Monthly Spending Trend</div>
            {loading ? (
                <div className={styles.skel} />
            ) : (
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                        <XAxis dataKey="name" stroke="#aaa" />
                        <YAxis tickFormatter={v => formatAda(v)} stroke="#aaa" />
                        <Tooltip formatter={v => formatAda(Number(v))} labelClassName={styles.tooltipLabel} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={2} dot={false} name="Withdrawn" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
} 