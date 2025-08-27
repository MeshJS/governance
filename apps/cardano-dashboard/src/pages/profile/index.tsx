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
        kind: 'fungible' | 'nft';
        formattedQuantity: string;
        displayName: string;
        imageUrl?: string | null;
        meta?: {
            policy_id: string;
            asset_name: string;
            asset_name_ascii?: string | null;
            fingerprint?: string;
            total_supply?: string;
            token_registry_metadata?: {
                name?: string;
                ticker?: string;
                decimals?: number;
                description?: string;
                url?: string;
                logo?: string;
            } | null;
            minting_tx_metadata?: unknown;
        };
    }>;
};

type WalletSummaryApiResponse = WalletSummary | { error: string };

export default function Profile({ auth }: Props) {
    const { connectedWallet, isConnecting } = useWallet();
    const [ada, setAda] = useState<string>('N/A');
    const [assets, setAssets] = useState<WalletSummary['assets']>([]);
    const [isFetching, setIsFetching] = useState(false);

    const loadBalance = useCallback(async () => {
        // Only load when wallet is actually enabled; do not use cookie-only address
        const address = connectedWallet?.wallet ? connectedWallet.address : undefined;
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
            console.log('wallet/summary', summary);
            // Client-side logging of Koios metadata per asset
            try {
                for (const a of summary.assets) {
                    if (a.meta) {
                        console.log('Asset meta', { unit: a.unit, policyId: a.policyId, assetNameHex: a.assetNameHex, meta: a.meta });
                    }
                }
            } catch { /* ignore logging errors */ }
            setAda(summary.ada);
            setAssets(summary.assets);
        } finally {
            setIsFetching(false);
        }
    }, [connectedWallet?.address, connectedWallet?.wallet]);

    useEffect(() => {
        if (connectedWallet?.wallet && connectedWallet?.address) {
            void loadBalance();
        } else {
            setAda('N/A');
            setAssets([]);
        }
    }, [connectedWallet?.wallet, connectedWallet?.address, loadBalance]);
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
            <p>Welcome{connectedWallet?.wallet && connectedWallet.address ? `, ${connectedWallet.address}` : ''}</p>
            <div style={{ marginTop: 12 }}>
                <button onClick={loadBalance} disabled={!(connectedWallet?.wallet) || isFetching}>
                    {isFetching ? 'Loading…' : 'Refresh balance'}
                </button>
                {connectedWallet?.wallet && (
                    <p style={{ marginTop: 12 }}>Wallet balance (ADA): {ada}</p>
                )}
                {connectedWallet?.wallet && assets.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 12 }}>
                        <div>
                            <h3>Fungible tokens</h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {assets.filter((a) => a.kind === 'fungible').map((a) => (
                                    <li key={a.unit} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        {a.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={a.imageUrl} alt={a.displayName} width={24} height={24} style={{ borderRadius: 4, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 24, height: 24, background: '#eee', borderRadius: 4 }} />
                                        )}
                                        <span style={{ fontWeight: 600 }}>{a.displayName}</span>
                                        <span style={{ marginLeft: 'auto' }}>{a.formattedQuantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3>NFTs</h3>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {assets.filter((a) => a.kind === 'nft').map((a) => (
                                    <li key={a.unit} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        {a.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={a.imageUrl} alt={a.displayName} width={36} height={36} style={{ borderRadius: 4, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 36, height: 36, background: '#eee', borderRadius: 4 }} />
                                        )}
                                        <span style={{ fontWeight: 600 }}>{a.displayName}</span>
                                        <span style={{ marginLeft: 'auto' }}>{a.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
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


