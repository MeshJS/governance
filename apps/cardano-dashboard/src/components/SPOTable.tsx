import React, { useState, useMemo } from 'react';
import styles from '../styles/SPOTable.module.css';
import { SPOData } from '../../types/spo';

interface SPOTableProps {
    spoData: SPOData[];
}

type SortField = 'pool_id_bech32' | 'ticker' | 'live_stake' | 'live_delegators' | 'live_pledge' | 'fixed_cost' | 'block_count';
type SortDirection = 'asc' | 'desc';

export default function SPOTable({ spoData }: SPOTableProps) {
    const [sortField, setSortField] = useState<SortField>('live_stake');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const formatPoolId = (poolId: string) => {
        if (!poolId) return '-';
        if (poolId.length <= 12) return poolId;
        return `${poolId.slice(0, 6)}...${poolId.slice(-6)}`;
    };

    const sortedAndFilteredData = useMemo(() => {
        let filtered = spoData.filter(spo => spo.meta_json?.ticker);

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(spo =>
                (spo.meta_json?.ticker?.toLowerCase().includes(searchLower)) ||
                (spo.meta_json?.name?.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            if (sortField === 'ticker') {
                const aTicker = a.meta_json?.ticker || '';
                const bTicker = b.meta_json?.ticker || '';
                return sortDirection === 'asc'
                    ? aTicker.localeCompare(bTicker)
                    : bTicker.localeCompare(aTicker);
            }

            if (sortField === 'block_count') {
                const aCount = a.block_count || 0;
                const bCount = b.block_count || 0;
                return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
            }

            const aValue = a[sortField];
            const bValue = b[sortField];

            // Handle string values (like live_stake)
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const aNum = parseFloat(aValue);
                const bNum = parseFloat(bValue);
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Handle number values
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return 0;
        });
    }, [spoData, sortField, sortDirection, searchTerm]);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatStake = (stake: string | number) => {
        const numStake = typeof stake === 'string' ? parseFloat(stake) : stake;
        const formattedNumber = (numStake / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 });
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
                    placeholder="Search by ticker or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('pool_id_bech32')} className={styles.sortableHeader}>
                                Pool ID {sortField === 'pool_id_bech32' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('ticker')} className={styles.sortableHeader}>
                                Ticker {sortField === 'ticker' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Name</th>
                            <th onClick={() => handleSort('live_stake')} className={styles.sortableHeader}>
                                Live Stake {sortField === 'live_stake' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('live_delegators')} className={styles.sortableHeader}>
                                Delegators {sortField === 'live_delegators' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('live_pledge')} className={styles.sortableHeader}>
                                Live Pledge {sortField === 'live_pledge' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('fixed_cost')} className={styles.sortableHeader}>
                                Fixed Cost {sortField === 'fixed_cost' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('block_count')} className={styles.sortableHeader}>
                                Block Count {sortField === 'block_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredData.map((spo) => (
                            <tr key={spo.pool_id_bech32}>
                                <td>{formatPoolId(spo.pool_id_bech32)}</td>
                                <td>{spo.meta_json?.ticker || '-'}</td>
                                <td>{spo.meta_json?.name || '-'}</td>
                                <td>{formatStake(spo.live_stake || '0')}</td>
                                <td>{spo.live_delegators?.toLocaleString() || '0'}</td>
                                <td>{formatStake(spo.live_pledge || '0')}</td>
                                <td>{formatStake(spo.fixed_cost || '0')}</td>
                                <td>{spo.block_count?.toLocaleString() || '0'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 