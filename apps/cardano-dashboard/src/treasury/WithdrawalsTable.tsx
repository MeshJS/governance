import React, { useState } from 'react';
import { WithdrawalRecord } from '@/contexts/DataContext';
import styles from './WithdrawalsTable.module.css';

function formatAda(amount: number) {
    return `₳${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
function formatDate(epoch: string) {
    if (!epoch) return '-';
    const d = new Date(Number(epoch) * 1000);
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function WithdrawalsTable({ withdrawals, loading, error, onRowClick }: {
    withdrawals: WithdrawalRecord[];
    loading: boolean;
    error: Error | null;
    onRowClick: (record: WithdrawalRecord) => void;
}) {
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const paged = withdrawals.slice(page * pageSize, (page + 1) * pageSize);
    const pageCount = Math.ceil(withdrawals.length / pageSize);

    if (error) return <div className={styles.error}>Error: {error.message}</div>;

    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Submission Date</th>
                        <th>Approval Date</th>
                        <th>Expiration Date</th>
                        <th>Amount</th>
                        <th>Proposal ID</th>
                        <th>Proposer Address</th>
                        <th>Transaction Hash</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: pageSize }).map((_, i) => (
                            <tr key={i} className={styles.skelRow}>
                                {Array.from({ length: 7 }).map((_, j) => (
                                    <td key={j}><div className={styles.skelCell} /></td>
                                ))}
                            </tr>
                        ))
                    ) : paged.length === 0 ? (
                        <tr><td colSpan={7} className={styles.empty}>No data</td></tr>
                    ) : (
                        paged.map(w => (
                            <tr key={w.id} className={styles.row} onClick={() => onRowClick(w)}>
                                <td>{formatDate(w.submission_date)}</td>
                                <td>{formatDate(w.approval_date)}</td>
                                <td>{formatDate(w.expiration_date)}</td>
                                <td>{formatAda(w.amount)}</td>
                                <td>{w.id}</td>
                                <td className={styles.addr}>{w.proposer_address}</td>
                                <td className={styles.hash}>{w.tx_hash}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <div className={styles.pagination}>
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>&lt; Prev</button>
                <span>Page {page + 1} of {pageCount || 1}</span>
                <button disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>Next &gt;</button>
            </div>
        </div>
    );
} 