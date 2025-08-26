import React, { useCallback, useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import type { AuthPayload } from '@/utils/authCookie';
import { verifyAuthCookie } from '@/utils/authCookie';
import { useWallet } from '@/contexts/WalletContext';

interface Props {
    auth: AuthPayload | null;
}

type WalletSummary = {
    address: string;
    network: 'mainnet' | 'preprod';
    lovelace: string;
    ada: string;
    assets: Array<{
        unit: string;
        policyId: string;
        assetNameHex: string;
        name: string;
        ticker?: string;
        decimals?: number;
        quantity: string;
    }>;
};

type WalletSummaryApiResponse = WalletSummary | { error: string };

export default function Profile({ auth }: Props) {
    const { connectedWallet, isConnecting } = useWallet();
    const [ada, setAda] = useState<string>('N/A');
    const [assets, setAssets] = useState<WalletSummary['assets']>([]);
    const [isFetching, setIsFetching] = useState(false);

    const loadBalance = useCallback(async () => {
        const address = connectedWallet?.address || auth?.address;
        if (!address) return;
        setIsFetching(true);
        try {
            let stakeAddress: string | undefined;
            try {
                if (connectedWallet?.wallet?.getRewardAddresses) {
                    const rewards = await connectedWallet.wallet.getRewardAddresses();
                    if (Array.isArray(rewards) && rewards.length > 0) {
                        stakeAddress = rewards[0];
                    }
                }
            } catch { }
            const resp = await fetch('/api/wallet/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ address, stakeAddress }),
            });
            const data = (await resp.json()) as WalletSummaryApiResponse;
            if (!resp.ok) {
                if ('error' in data) throw new Error(data.error);
                throw new Error('Failed to load wallet summary');
            }
            if ('error' in data) throw new Error(data.error);
            const summary = data;
            setAda(summary.ada);
            setAssets(summary.assets);
        } finally {
            setIsFetching(false);
        }
    }, [connectedWallet?.address, connectedWallet?.wallet, auth?.address]);

    useEffect(() => {
        if (connectedWallet?.address || auth?.address) {
            void loadBalance();
        } else {
            setAda('N/A');
            setAssets([]);
        }
    }, [connectedWallet?.address, auth?.address, loadBalance]);
    if (!auth) {
        return (
            <div style={{ padding: 24 }}>
                <h1>Profile</h1>
                <p>Please sign in with your wallet to access this page.</p>
                <p style={{ marginTop: 12 }}>
                    Wallet status: {isConnecting ? 'Connecting…' : connectedWallet ? `${connectedWallet.balance ?? 'N/A'} ADA` : 'Not connected'}
                </p>
                {connectedWallet?.wallet && (
                    <>
                        <button onClick={loadBalance} disabled={isFetching} style={{ marginTop: 12 }}>
                            {isFetching ? 'Loading…' : 'Refresh balance'}
                        </button>
                        <p style={{ marginTop: 12 }}>Wallet balance (ADA): {ada}</p>
                        {assets.length > 0 && (
                            <ul>
                                {assets.map((a) => (
                                    <li key={a.unit}>{a.name}{a.ticker ? ` (${a.ticker})` : ''}: {a.quantity}</li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        );
    }
    return (
        <div style={{ padding: 24 }}>
            <h1>Profile</h1>
            <p>Welcome, {auth.address}</p>
            <div style={{ marginTop: 12 }}>
                <button onClick={loadBalance} disabled={!(connectedWallet?.wallet || auth?.address) || isFetching}>
                    {isFetching ? 'Loading…' : 'Refresh balance'}
                </button>
                <p style={{ marginTop: 12 }}>Wallet balance (ADA): {ada}</p>
                {assets.length > 0 && (
                    <ul>
                        {assets.map((a) => (
                            <li key={a.unit}>{a.name}{a.ticker ? ` (${a.ticker})` : ''}: {a.quantity}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
    const cookie = req.cookies['cd_auth'];
    const auth = verifyAuthCookie(cookie);
    return { props: { auth } };
};


