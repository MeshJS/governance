import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useLocalStorageCache } from './useLocalStorageCache';
import { KoiosProposal } from '../types/koios';
import { WithdrawalRecord, DataContextType } from '../types/datacontext';

export function useDataContext() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useDataContext must be used within a DataProvider');
    return ctx;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);

    // 10 minutes TTL
    const [cached, setCached, isExpired] = useLocalStorageCache<WithdrawalRecord[]>('treasury_withdrawals', 10 * 60 * 1000);

    const fetchTreasuryProposals = useCallback(async (limit = 10, offset = 0): Promise<WithdrawalRecord[]> => {
        const res = await fetch(`/api/koios-treasury?limit=${limit}&offset=${offset}`);
        if (!res.ok) throw new Error('Failed to fetch Koios proposals');
        // Map Koios response to WithdrawalRecord[]
        const data = await res.json();
        console.log(data);
        return data.map((item: any) => ({
            id: item.proposal_id,
            submission_date: item.proposed_epoch,
            approval_date: item.ratified_epoch,
            expiration_date: item.expiration,
            amount: Number(item.withdrawal?.amount ?? 0),
            proposer_address: item.withdrawal?.stake_address ?? '',
            purpose: '', // Not available from Koios
            tx_hash: item.proposal_tx_hash,
        }));
    }, []);

    const upsertTreasuryData = useCallback(async (records: WithdrawalRecord[]): Promise<void> => {
        if (!records.length) return;
        const { error } = await supabase.from('treasury_withdrawals').upsert(records, { onConflict: 'id' });
        if (error) throw error;
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const records = await fetchTreasuryProposals(10, 0);
            console.log(records);
            setWithdrawals(records);
            setCached(records);
            setLastUpdated(new Date());
            await upsertTreasuryData(records);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [fetchTreasuryProposals, setCached, upsertTreasuryData]);

    // On mount, load from cache or fetch
    useEffect(() => {
        if (cached && !isExpired) {
            setWithdrawals(cached);
        } else {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-refresh every 10 minutes
    useEffect(() => {
        const interval = setInterval(refresh, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refresh]);

    return (
        <DataContext.Provider value={{ withdrawals, loading, error, lastUpdated, refresh }}>
            {children}
        </DataContext.Provider>
    );
}; 