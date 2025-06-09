import React, { useState, useMemo } from 'react';
import styles from '../styles/DRepTable.module.css';
import { DRepDetailedData } from '../../types/drep';

interface DRepTableProps {
    drepData: DRepDetailedData[];
}

type SortField = 'drep_id' | 'givenName' | 'total_delegators' | 'amount' | 'expires_epoch_no';
type SortDirection = 'asc' | 'desc';

export default function DRepTable({ drepData }: DRepTableProps) {
    const [sortField, setSortField] = useState<SortField>('amount');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const formatDRepId = (drepId: string) => {
        if (!drepId) return '-';
        if (drepId.length <= 12) return drepId;
        return `${drepId.slice(0, 6)}...${drepId.slice(-6)}`;
    };

    const getDRepName = (drep: DRepDetailedData) => {
        let name = 'Unknown';
        if (drep.meta_json?.body?.givenName) {
            if (typeof drep.meta_json.body.givenName === 'string') {
                name = drep.meta_json.body.givenName;
            } else if (typeof drep.meta_json.body.givenName === 'object' && drep.meta_json.body.givenName['@value']) {
                name = drep.meta_json.body.givenName['@value'];
            }
        }

        // Handle cases where name might be an object or invalid value
        if (typeof name !== 'string') {
            try {
                name = JSON.stringify(name);
            } catch {
                name = 'Unknown';
            }
        }

        return name;
    };

    const sortedAndFilteredData = useMemo(() => {
        let filtered = drepData;

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(drep =>
                (getDRepName(drep).toLowerCase().includes(searchLower)) ||
                (drep.drep_id?.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            if (sortField === 'givenName') {
                const aName = getDRepName(a);
                const bName = getDRepName(b);
                return sortDirection === 'asc'
                    ? aName.localeCompare(bName)
                    : bName.localeCompare(aName);
            }

            if (sortField === 'total_delegators') {
                const aCount = a.total_delegators || 0;
                const bCount = b.total_delegators || 0;
                return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
            }

            if (sortField === 'expires_epoch_no') {
                const aEpoch = a.expires_epoch_no || 0;
                const bEpoch = b.expires_epoch_no || 0;
                return sortDirection === 'asc' ? aEpoch - bEpoch : bEpoch - aEpoch;
            }

            const aValue = a[sortField];
            const bValue = b[sortField];

            // Handle string values (like amount)
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

            return 0;
        });
    }, [drepData, sortField, sortDirection, searchTerm]);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatAmount = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const formattedNumber = (numAmount / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 });
        return (
            <span className={styles.adaAmount}>
                <span className={styles.adaSymbol}>₳</span>
                <span>{formattedNumber}</span>
            </span>
        );
    };

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
                <input
                    type="text"
                    placeholder="Search by name or DRep ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th onClick={() => handleSort('drep_id')} className={styles.sortableHeader}>
                                DRep ID {sortField === 'drep_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('givenName')} className={styles.sortableHeader}>
                                Name {sortField === 'givenName' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('total_delegators')} className={styles.sortableHeader}>
                                Delegators {sortField === 'total_delegators' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('amount')} className={styles.sortableHeader}>
                                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('expires_epoch_no')} className={styles.sortableHeader}>
                                Expires {sortField === 'expires_epoch_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredData.map((drep) => (
                            <tr key={drep.drep_id}>
                                <td>
                                    {drep.meta_json?.body?.image?.contentUrl ? (
                                        <img
                                            src={drep.meta_json.body.image.contentUrl}
                                            alt={getDRepName(drep)}
                                            className={styles.drepImage}
                                        />
                                    ) : (
                                        <div className={styles.placeholderImage}>?</div>
                                    )}
                                </td>
                                <td>{formatDRepId(drep.drep_id)}</td>
                                <td>{getDRepName(drep)}</td>
                                <td>{drep.total_delegators?.toLocaleString() || '0'}</td>
                                <td>{formatAmount(drep.amount || '0')}</td>
                                <td>Epoch {drep.expires_epoch_no}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 