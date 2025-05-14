import React, { useState } from 'react';
import styles from './FiltersToolbar.module.css';

export interface Filters {
    submissionFrom?: string;
    submissionTo?: string;
    approvalFrom?: string;
    approvalTo?: string;
    search?: string;
    sort?: string;
}

const sortOptions = [
    { value: 'approval_date_desc', label: 'Approval Date (Newest)' },
    { value: 'approval_date_asc', label: 'Approval Date (Oldest)' },
    { value: 'amount_desc', label: 'Amount (High-Low)' },
    { value: 'amount_asc', label: 'Amount (Low-High)' },
];

export default function FiltersToolbar({ onChange }: { onChange?: (filters: Filters) => void }) {
    const [filters, setFilters] = useState<Filters>({ sort: 'approval_date_desc' });

    function handleChange(next: Partial<Filters>) {
        const updated = { ...filters, ...next };
        setFilters(updated);
        onChange?.(updated);
    }

    function handleExport() {
        // Placeholder: actual export logic will be implemented later
        alert('Export CSV not yet implemented');
    }

    return (
        <div className={styles.toolbar}>
            <div className={styles.group}>
                <label>Submission Date:</label>
                <input type="date" value={filters.submissionFrom || ''} onChange={e => handleChange({ submissionFrom: e.target.value })} />
                <span>-</span>
                <input type="date" value={filters.submissionTo || ''} onChange={e => handleChange({ submissionTo: e.target.value })} />
            </div>
            <div className={styles.group}>
                <label>Approval Date:</label>
                <input type="date" value={filters.approvalFrom || ''} onChange={e => handleChange({ approvalFrom: e.target.value })} />
                <span>-</span>
                <input type="date" value={filters.approvalTo || ''} onChange={e => handleChange({ approvalTo: e.target.value })} />
            </div>
            <div className={styles.group}>
                <input
                    type="text"
                    placeholder="Search Proposal ID or Proposer"
                    value={filters.search || ''}
                    onChange={e => handleChange({ search: e.target.value })}
                />
            </div>
            <div className={styles.group}>
                <select value={filters.sort} onChange={e => handleChange({ sort: e.target.value })}>
                    {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <button className={styles.exportBtn} onClick={handleExport}>Export CSV</button>
        </div>
    );
} 