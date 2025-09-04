import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { BrowserWallet } from '@meshsdk/core';

export interface WalletInfo {
    id: string;
    name: string;
    icon: string;
    version: string;
}

export interface ConnectedWallet {
    wallet: BrowserWallet;
    id: string;
    name: string;
    icon: string;
    version: string;
    address?: string;
    balance?: string;
    networkId?: number;
    isVerified?: boolean;
    fingerprints?: string[];
}

interface WalletContextType {
    // Available wallets
    availableWallets: WalletInfo[];
    isLoadingWallets: boolean;

    // Connected wallet
    connectedWallet: ConnectedWallet | null;
    isConnecting: boolean;
    isDisconnecting: boolean;
    // Session (cookie) state
    sessionAddress: string | null;

    // Actions
    refreshAvailableWallets: () => Promise<void>;
    connectWallet: (walletName: string) => Promise<void>;
    disconnectWallet: () => Promise<void>;

    // Errors
    error: string | null;
    clearError: () => void;
    getFingerprints: () => Promise<string[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const router = useRouter();
    const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
    const [isLoadingWallets, setIsLoadingWallets] = useState(false);
    const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionAddress, setSessionAddress] = useState<string | null>(null);

    // Load available wallets on mount
    useEffect(() => {
        refreshAvailableWallets();
    }, []);

    const refreshAvailableWallets = async () => {
        setIsLoadingWallets(true);
        setError(null);

        try {
            const wallets = await BrowserWallet.getAvailableWallets();
            setAvailableWallets(wallets);

        } catch (err) {
            console.error('Failed to get available wallets:', err);
            setError('Failed to load available wallets');
        } finally {
            setIsLoadingWallets(false);
        }
    };

    const getFingerprints = async (): Promise<string[]> => {
        try {
            const w = connectedWallet?.wallet;
            if (!w) return [];
            const assets = await (w as unknown as { getAssets?: () => Promise<Array<{ fingerprint?: string | null }>> }).getAssets?.();
            if (!Array.isArray(assets)) return [];
            const fps = new Set<string>();
            for (const a of assets) {
                const fp = typeof a?.fingerprint === 'string' ? a.fingerprint : undefined;
                if (fp && /^asset1[0-9a-z]{10,}$/.test(fp)) fps.add(fp.toLowerCase());
            }
            return Array.from(fps);
        } catch {
            return [];
        }
    };

    const getFingerprintsFromWallet = async (wallet: BrowserWallet): Promise<string[]> => {
        try {
            const assets = await (wallet as unknown as { getAssets?: () => Promise<Array<{ fingerprint?: string | null }>> }).getAssets?.();
            if (!Array.isArray(assets)) return [];
            const fps = new Set<string>();
            for (const a of assets) {
                const fp = typeof a?.fingerprint === 'string' ? a.fingerprint : undefined;
                if (fp && /^asset1[0-9a-z]{10,}$/.test(fp)) fps.add(fp.toLowerCase());
            }
            return Array.from(fps);
        } catch {
            return [];
        }
    };

    const connectWallet = async (walletName: string) => {
        setIsConnecting(true);
        setError(null);

        try {
            // Find wallet info first to get the correct ID
            const walletInfo = availableWallets.find(w => w.name === walletName);
            if (!walletInfo) {
                throw new Error('Wallet info not found');
            }

            // Enable the wallet using the ID, not the display name
            const wallet = await BrowserWallet.enable(walletInfo.id);

            // Get basic wallet information
            let address: string | undefined;
            let balance: string | undefined;
            let networkId: number | undefined;

            try {
                // Try to obtain a bech32 payment address ('addr...' or 'addr_test...')
                const candidates: string[] = [];
                try { const a = await wallet.getChangeAddress(); if (a) candidates.push(a); } catch { }
                try { const used = await wallet.getUsedAddresses(); if (used?.length) candidates.push(...used); } catch { }
                try { const unused = await wallet.getUnusedAddresses(); if (unused?.length) candidates.push(...unused); } catch { }
                try { const rewards = await wallet.getRewardAddresses(); if (rewards?.length) candidates.push(...rewards); } catch { }

                const bech32Addr = candidates.find((a) => typeof a === 'string' && (a.startsWith('addr') || a.startsWith('addr_test')))
                    ?? candidates.find((a) => typeof a === 'string' && (a.startsWith('stake') || a.startsWith('stake_test')));

                if (bech32Addr) {
                    address = bech32Addr;
                }

                // Get ADA balance
                const lovelace = await wallet.getLovelace();
                balance = (parseInt(lovelace) / 1000000).toString(); // Convert to ADA

                // Get network ID
                networkId = await wallet.getNetworkId();
            } catch {
                // Continue with basic connection even if some info fails
            }

            const connectedWalletData: ConnectedWallet = {
                wallet,
                id: walletInfo.id,
                name: walletInfo.name,
                icon: walletInfo.icon,
                version: walletInfo.version,
                address,
                balance,
                networkId,
            };
            // Enrich with fingerprints (best-effort)
            try { connectedWalletData.fingerprints = await getFingerprintsFromWallet(wallet); } catch { }
            setConnectedWallet(connectedWalletData);

            // Writes are handled server-side via /api/auth/nonce and /api/auth/verify

            // Nonce → signData → verify flow
            try {
                if (address) {
                    // Try to get a stake address from the wallet (reward address)
                    let stakeAddress: string | undefined;
                    try {
                        const rewards = await wallet.getRewardAddresses();
                        if (Array.isArray(rewards) && rewards.length > 0) {
                            stakeAddress = rewards[0];
                        }
                    } catch { }

                    // 1) Request nonce
                    const nonceResp = await fetch('/api/auth/nonce', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ address, walletName: walletInfo.name, networkId, stakeAddress }),
                    });
                    const nonceJson = await nonceResp.json();
                    if (!nonceResp.ok) throw new Error(nonceJson?.error || 'Failed to get nonce');

                    const nonce: string = nonceJson.nonce; // human-readable message from server
                    // 2) Sign message with CIP-8: signData(message, address)
                    const signed = await wallet.signData(nonce, address);
                    // 3) Verify server-side, set session cookie
                    const verifyResp = await fetch('/api/auth/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ address, signature: signed, }),
                    });
                    const verifyJson = await verifyResp.json();
                    if (!verifyResp.ok) throw new Error(verifyJson?.error || 'Failed to verify signature');

                    setConnectedWallet(prev => prev ? { ...prev, isVerified: true } : prev);
                    // Update session address immediately so dependent UIs refresh
                    try { if (address) setSessionAddress(address); } catch { }

                    // Refresh current page to re-run getServerSideProps (e.g., /profile)
                    try {
                        await router.replace(router.asPath, undefined, { scroll: false });
                    } catch { }
                }
            } catch (authErr) {
                console.error('Wallet signature verification failed:', authErr);
            }

            // Store connection in localStorage for persistence (include id for reliable restore)
            if (typeof window !== 'undefined') {
                localStorage.setItem('cardano-dashboard-connected-wallet', JSON.stringify({
                    id: walletInfo.id,
                    name: walletInfo.name,
                    timestamp: Date.now(),
                }));
            }

        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = async () => {
        setIsDisconnecting(true);
        setError(null);

        try {
            // Clear connected wallet state
            setConnectedWallet(null);

            // Remove from localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('cardano-dashboard-connected-wallet');
            }

            // Clear auth cookie on server so SSR pages no longer show address
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
                // Clear session address immediately so dependent UIs refresh
                setSessionAddress(null);
                try {
                    await router.replace(router.asPath, undefined, { scroll: false });
                } catch { }
            } catch { }

        } catch (err) {
            console.error('Failed to disconnect wallet:', err);
            setError('Failed to disconnect wallet');
        } finally {
            setIsDisconnecting(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    // Check auth cookie and silently re-enable wallet on mount/availability
    useEffect(() => {
        let cancelled = false;
        async function init() {
            if (typeof window === 'undefined') return;
            const savedConnection = localStorage.getItem('cardano-dashboard-connected-wallet');
            const meResp = await fetch('/api/auth/me', { credentials: 'same-origin' });
            const me = await meResp.json();
            setSessionAddress(me?.authenticated ? (me?.address ?? null) : null);

            if (!savedConnection || !me?.authenticated) return;
            try {
                const { id, name, timestamp } = JSON.parse(savedConnection);
                const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // Align with auth cookie Max-Age
                const connectionAge = Date.now() - timestamp;
                if (connectionAge >= THIRTY_DAYS_MS) {
                    localStorage.removeItem('cardano-dashboard-connected-wallet');
                    return;
                }
                // Prefer id match (new data), fallback to name (backward compatibility)
                const walletInfo = availableWallets.find(w => (id ? w.id === id : w.name === name));
                if (!walletInfo) return;

                // Silently re-enable selected wallet without re-sign; keep session from cookie
                setIsConnecting(true);
                const wallet = await BrowserWallet.enable(walletInfo.id);

                let address: string | undefined;
                let balance: string | undefined;
                let networkId: number | undefined;
                try {
                    const change = await wallet.getChangeAddress();
                    if (change) {
                        address = change;
                    } else {
                        const used = await wallet.getUsedAddresses();
                        if (used?.length) address = used[0];
                        if (!address) {
                            const unused = await wallet.getUnusedAddresses();
                            if (unused?.length) address = unused[0];
                        }
                    }
                    const lovelace = await wallet.getLovelace();
                    balance = (parseInt(lovelace) / 1000000).toString();
                    networkId = await wallet.getNetworkId();
                } catch { }

                const connectedWalletData: ConnectedWallet = {
                    wallet,
                    id: walletInfo.id,
                    name: walletInfo.name,
                    icon: walletInfo.icon,
                    version: walletInfo.version,
                    address,
                    balance,
                    networkId,
                    isVerified: !!me?.authenticated,
                };
                // Enrich with fingerprints (best-effort)
                try { connectedWalletData.fingerprints = await getFingerprintsFromWallet(wallet); } catch { }
                if (!cancelled) setConnectedWallet(connectedWalletData);
            } catch (err) {
                console.error('Silent wallet restore failed:', err);
            } finally {
                if (!cancelled) setIsConnecting(false);
            }
        }
        init();
        return () => { cancelled = true; };
    }, [availableWallets]);

    const value: WalletContextType = {
        availableWallets,
        isLoadingWallets,
        connectedWallet,
        isConnecting,
        isDisconnecting,
        sessionAddress,
        refreshAvailableWallets,
        connectWallet,
        disconnectWallet,
        error,
        clearError,
        getFingerprints,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}
