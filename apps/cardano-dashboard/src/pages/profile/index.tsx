import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import type { AuthPayload } from '@/utils/authCookie';
import { verifyAuthCookie } from '@/utils/authCookie';
import { useWallet } from '@/contexts/WalletContext';
import styles from './index.module.css';
import TokenModal from '@/components/token-modal/TokenModal';
import type { TokenModalItem } from '@/components/token-modal/TokenModal';

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

type ShortenOptions = { prefix?: number; suffix?: number };
function shortenMiddle(text: string, { prefix = 8, suffix = 6 }: ShortenOptions = {}): string {
    if (typeof text !== 'string') return '';
    if (text.length <= prefix + suffix + 3) return text;
    return `${text.slice(0, prefix)}...${text.slice(-suffix)}`;
}

export default function Profile({ auth }: Props) {
    const { connectedWallet, isConnecting, sessionAddress } = useWallet();
    const [ada, setAda] = useState<string>('N/A');
    const [assets, setAssets] = useState<WalletSummary['assets']>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [projects, setProjects] = useState<Array<{ id: string; slug: string; name: string; category: string | null; is_active: boolean }>>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalVariant, setModalVariant] = useState<'fungible' | 'nft'>('fungible');

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

    // Load projects the authenticated wallet can edit/owns (requires session cookie)
    useEffect(() => {
        let cancelled = false;
        async function loadProjects() {
            if (!sessionAddress) {
                setProjects([]);
                return;
            }
            setIsLoadingProjects(true);
            try {
                // Attach nft_units if available to include NFT-based roles
                const url = '/api/projects?only_editable=true&include_inactive=true';
                const resp = await fetch(url, { credentials: 'same-origin' });
                const data = await resp.json().catch(() => ({} as { projects?: unknown }));
                if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to load projects');
                if (!cancelled) {
                    const list = (data as { projects?: Array<{ id: string; slug: string; name: string; category: string | null; is_active: boolean }> }).projects ?? [];
                    setProjects(list);
                }
            } catch {
                if (!cancelled) setProjects([]);
            } finally {
                if (!cancelled) setIsLoadingProjects(false);
            }
        }
        void loadProjects();
        return () => { cancelled = true; };
    }, [sessionAddress]);

    const fungibleAssets = useMemo(() => assets.filter((a) => a.kind === 'fungible'), [assets]);
    const nftAssets = useMemo(() => assets.filter((a) => a.kind === 'nft'), [assets]);

    const modalItems: TokenModalItem[] = useMemo(() => {
        const source = modalVariant === 'fungible' ? fungibleAssets : nftAssets;
        return source.map((a) => ({
            unit: a.unit,
            displayName: a.displayName,
            imageUrl: a.imageUrl ?? null,
            amountText: modalVariant === 'fungible' ? a.formattedQuantity : undefined,
        }));
    }, [fungibleAssets, nftAssets, modalVariant]);

    const shortenedAddress = useMemo(() => {
        return connectedWallet?.address ? shortenMiddle(connectedWallet.address, { prefix: 10, suffix: 8 }) : null;
    }, [connectedWallet?.address]);

    const ProjectsSection = () => {
        if (!sessionAddress) return null;
        return (
            <div style={{ marginTop: 24 }}>
                <h2 className={styles.sectionTitle}>Projects</h2>
                {isLoadingProjects ? (
                    <p>Loading…</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th>Category</th>
                                    <th>Active</th>
                                    <th>URL</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td>{p.slug}</td>
                                        <td>{p.category ?? ''}</td>
                                        <td>{p.is_active ? 'Yes' : 'No'}</td>
                                        <td>
                                            <a className={styles.linkAnchor} href={`/projects/${encodeURIComponent(p.slug)}`}>link</a>
                                        </td>
                                        <td>
                                            <Link className={styles.linkAnchor} href={`/projects/manage?edit=${encodeURIComponent(p.slug)}`}>Edit</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {projects.length === 0 && <p className={styles.muted}>No projects yet.</p>}
                    </div>
                )}
            </div>
        );
    };
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
                <div style={{ marginTop: 12 }}>
                    <Link href="/projects/manage">Manage projects</Link>
                </div>
                <ProjectsSection />
            </div>
        );
    }
    return (
        <div style={{ padding: 24 }}>
            <h1>Profile</h1>
            <p>Welcome{connectedWallet?.wallet && shortenedAddress ? `, ${shortenedAddress}` : ''}</p>
            <div style={{ marginTop: 12 }}>
                <button onClick={loadBalance} disabled={!(connectedWallet?.wallet) || isFetching}>
                    {isFetching ? 'Loading…' : 'Refresh balance'}
                </button>
                {connectedWallet?.wallet && (
                    <p style={{ marginTop: 12 }}>Wallet balance (ADA): {(() => { const n = Number(ada); return Number.isFinite(n) ? Math.floor(n).toString() : ada; })()}</p>
                )}
                {connectedWallet?.wallet && assets.length > 0 && (
                    <div className={styles.cardsGrid}>
                        <button
                            type="button"
                            className={`${styles.card} ${styles.summaryCard}`}
                            onClick={() => { setModalVariant('fungible'); setIsModalOpen(true); }}
                        >
                            <div>
                                <h3 className={styles.cardTitle}>Fungible tokens</h3>
                                <div className={styles.statSub}>Count</div>
                            </div>
                            <div className={styles.statValue}>{fungibleAssets.length}</div>
                        </button>
                        <button
                            type="button"
                            className={`${styles.card} ${styles.summaryCard}`}
                            onClick={() => { setModalVariant('nft'); setIsModalOpen(true); }}
                        >
                            <div>
                                <h3 className={styles.cardTitle}>NFTs</h3>
                                <div className={styles.statSub}>Count</div>
                            </div>
                            <div className={styles.statValue}>{nftAssets.length}</div>
                        </button>
                    </div>
                )}
            </div>
            <div style={{ marginTop: 12 }}>
                <Link href="/projects/manage">Manage projects</Link>
            </div>
            <ProjectsSection />
            <TokenModal
                isOpen={isModalOpen}
                title={modalVariant === 'fungible' ? 'Fungible tokens' : 'NFTs'}
                variant={modalVariant}
                items={modalItems}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
    const cookie = req.cookies['cd_auth'];
    const auth = verifyAuthCookie(cookie);
    return { props: { auth } };
};


