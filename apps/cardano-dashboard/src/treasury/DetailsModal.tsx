import React from 'react';
import { WithdrawalRecord } from '@/contexts/DataContext';
import styles from './DetailsModal.module.css';

export default function DetailsModal({ record, onClose }: { record: WithdrawalRecord | null; onClose: () => void }) {
    if (!record) return null;
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.close} onClick={onClose}>&times;</button>
                <h2>Withdrawal Details</h2>
                <div className={styles.field}><span>Proposal ID:</span> {record.id}</div>
                <div className={styles.field}><span>Submission Date:</span> {record.submission_date}</div>
                <div className={styles.field}><span>Approval Date:</span> {record.approval_date}</div>
                <div className={styles.field}><span>Expiration Date:</span> {record.expiration_date}</div>
                <div className={styles.field}><span>Amount:</span> {record.amount}</div>
                <div className={styles.field}><span>Proposer Address:</span> {record.proposer_address}</div>
                <div className={styles.field}><span>Transaction Hash:</span> <span className={styles.hash}>{record.tx_hash}</span></div>
                <a
                    href={`https://adastat.net/transaction/${record.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    View on ADAStat
                </a>
            </div>
        </div>
    );
} 