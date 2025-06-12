import { useState, useEffect, Dispatch, SetStateAction } from 'react';

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

export function useLocalStorageCache<T>(key: string, ttlMs: number): [T | null, Dispatch<SetStateAction<T | null>>, boolean] {
    const [value, setValue] = useState<T | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const entryStr = localStorage.getItem(key);
        if (entryStr) {
            try {
                const entry: CacheEntry<T> = JSON.parse(entryStr);
                const expired = Date.now() - entry.timestamp > ttlMs;
                setIsExpired(expired);
                setValue(expired ? null : entry.value);
            } catch {
                setIsExpired(true);
                setValue(null);
            }
        } else {
            setIsExpired(true);
            setValue(null);
        }
    }, [key, ttlMs]);

    useEffect(() => {
        if (value !== null && !isExpired) {
            const entry: CacheEntry<T> = { value, timestamp: Date.now() };
            localStorage.setItem(key, JSON.stringify(entry));
        }
    }, [key, value, isExpired]);

    return [value, setValue, isExpired];
} 