import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import { formatAddressShort } from '@/utils/address';
import type { ProjectRecord } from '@/types/projects';
import { useWallet } from '@/contexts/WalletContext';
import { mintRoleNft } from '@/lib/mint-role-nft';
import { uploadImageToPinata } from '@/utils/uploadImage';

export type EditorsModalProps = {
    isOpen: boolean;
    project: ProjectRecord | null;
    canSubmit: boolean;
    onClose: () => void;
};

type RoleItem = { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy' | 'nft_fingerprint'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null; fingerprint?: string | null };

export function EditorsModal({ isOpen, project, canSubmit, onClose }: EditorsModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [newWallet, setNewWallet] = useState('');
    const [newFingerprint, setNewFingerprint] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
    const [ownerWallet, setOwnerWallet] = useState('');
    const [ownerFingerprintCsv, setOwnerFingerprintCsv] = useState('');
    const { connectedWallet } = useWallet();

    // Minting state
    const [mintRecipient, setMintRecipient] = useState('');
    const [mintImageUrl, setMintImageUrl] = useState('');
    const [mintPolicy, setMintPolicy] = useState<'open' | 'closed'>('open');
    const [isMinting, setIsMinting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mintImageFile, setMintImageFile] = useState<File | null>(null);

    const defaultRecipient = useMemo(() => connectedWallet?.address || '', [connectedWallet?.address]);

    useEffect(() => {
        if (!project?.id || !isOpen) {
            setRoles([]);
            setNewWallet('');
            setNewFingerprint('');
            setNewRole('editor');
            setOwnerWallet('');
            setOwnerFingerprintCsv('');
            setError(null);
            return;
        }
        if (!canSubmit) {
            // If not owner, do not load roles at all
            setRoles([]);
            setOwnerFingerprintCsv((project.owner_nft_fingerprints ?? []).join(', '));
            return;
        }
        (async () => {
            try {
                const rolesResp = await fetch(`/api/projects/roles?project_id=${encodeURIComponent(project.id)}`);
                if (rolesResp.ok) {
                    const data: { roles?: RoleItem[] } = await rolesResp.json();
                    setRoles((data?.roles ?? []));
                } else {
                    setRoles([]);
                }
                setOwnerFingerprintCsv((project.owner_nft_fingerprints ?? []).join(', '));
                setMintRecipient(defaultRecipient);
            } catch {
                setRoles([]);
            }
        })();
    }, [project?.id, isOpen, project?.owner_nft_fingerprints, canSubmit, defaultRecipient]);

    const addWalletRole = useCallback(async () => {
        if (!project?.id || !newWallet.trim()) return;
        try {
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'wallet', wallet_address: newWallet.trim() }),
            });
            const data: { role?: RoleItem; error?: string } = await resp.json().catch(() => ({}) as { role?: RoleItem; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add wallet role');
            setNewWallet('');
            if (data.role) setRoles((prev) => prev.concat(data.role as RoleItem));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add wallet role');
        }
    }, [project?.id, newWallet, newRole]);

    const addFingerprintRole = useCallback(async () => {
        if (!project?.id || !newFingerprint.trim()) return;
        try {
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'nft_fingerprint', fingerprint: newFingerprint.trim() }),
            });
            const data: { role?: RoleItem; error?: string } = await resp.json().catch(() => ({}) as { role?: RoleItem; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add fingerprint role');
            setNewFingerprint('');
            if (data.role) setRoles((prev) => prev.concat(data.role as RoleItem));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add fingerprint role');
        }
    }, [project?.id, newFingerprint, newRole]);

    const removeRole = useCallback(async (r: { role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy' | 'nft_fingerprint'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null; fingerprint?: string | null }) => {
        if (!project?.id) return;
        try {
            const params = new URLSearchParams({ project_id: project.id, role: r.role, principal_type: r.principal_type });
            if (r.principal_type === 'wallet') {
                params.set('wallet_address', r.stake_address || r.wallet_payment_address || '');
            } else {
                params.set('fingerprint', r.fingerprint || '');
            }
            const resp = await fetch(`/api/projects/roles?${params.toString()}`, { method: 'DELETE' });
            if (!resp.ok && resp.status !== 204) {
                const data = await resp.json().catch(() => ({}));
                throw new Error((data as { error?: string })?.error || 'Failed to remove role');
            }
            setRoles((prev) => prev.filter((x) => {
                const sameRole = x.role === r.role && x.principal_type === r.principal_type;
                if (!sameRole) return true;
                if (r.principal_type === 'wallet') {
                    const match = (x.stake_address && r.stake_address && x.stake_address === r.stake_address)
                        || (x.wallet_payment_address && r.wallet_payment_address && x.wallet_payment_address === r.wallet_payment_address);
                    return !match;
                } else {
                    return !(x.fingerprint && r.fingerprint && x.fingerprint === r.fingerprint);
                }
            }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to remove role');
        }
    }, [project?.id]);

    const transferOwner = useCallback(async () => {
        if (!project?.id || !ownerWallet.trim()) return;
        try {
            const resp = await fetch('/api/projects/owner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id, new_owner_address: ownerWallet.trim() }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to transfer owner');
            setOwnerWallet('');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to transfer owner');
        }
    }, [project?.id, ownerWallet]);

    const saveOwnerFingerprints = useCallback(async () => {
        if (!project?.id) return;
        try {
            const resp = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: project.id, owner_nft_fingerprints: ownerFingerprintCsv.split(',').map((s) => s.trim()).filter(Boolean) }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to save owner fingerprints');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save owner fingerprints');
        }
    }, [project?.id, ownerFingerprintCsv]);

    const getRecipientFingerprints = useCallback(async (address: string): Promise<string[]> => {
        try {
            const resp = await fetch('/api/wallet/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to query wallet');
            const fps = new Set<string>();
            for (const a of (data?.assets ?? [])) {
                const fp = typeof a?.fingerprint === 'string' ? a.fingerprint : undefined;
                if (fp && /^asset1[0-9a-z]{10,}$/.test(fp)) fps.add(fp.toLowerCase());
            }
            return Array.from(fps);
        } catch {
            return [];
        }
    }, []);

    const addFingerprintViaApi = useCallback(async (fingerprint: string, role: 'admin' | 'editor'): Promise<RoleItem | null> => {
        if (!project?.id) return null;
        const resp = await fetch('/api/projects/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: project.id, role, principal_type: 'nft_fingerprint', fingerprint }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to add fingerprint role');
        return (data as { role?: RoleItem }).role || null;
    }, [project?.id]);

    const onMintRoleNft = useCallback(async () => {
        setError(null);
        if (!project?.id) return;
        if (!canSubmit) return;
        if (!connectedWallet?.wallet) { setError('Connect a wallet to mint.'); return; }
        const recipient = (mintRecipient || defaultRecipient || '').trim();
        if (!recipient) { setError('Recipient address is required'); return; }
        try {
            setIsMinting(true);
            // Snapshot recipient fingerprints
            const beforeFps = await getRecipientFingerprints(recipient);

            await mintRoleNft({
                wallet: connectedWallet.wallet,
                recipientAddress: recipient,
                role: newRole,
                projectName: project.name,
                imageUrl: mintImageUrl || undefined,
                policyType: mintPolicy,
            });

            // Poll for the new fingerprint for a short period
            let afterFps: string[] = [];
            const MAX_TRIES = 6;
            for (let i = 0; i < MAX_TRIES; i++) {
                await new Promise((r) => setTimeout(r, 3000));
                afterFps = await getRecipientFingerprints(recipient);
                const diff = afterFps.filter((fp) => !beforeFps.includes(fp));
                if (diff.length > 0) {
                    // Register all new fingerprints under selected role
                    for (const fp of diff) {
                        try {
                            const added = await addFingerprintViaApi(fp, newRole);
                            if (added) setRoles((prev) => prev.concat(added as RoleItem));
                        } catch { /* ignore single fingerprint failure */ }
                    }
                    break;
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to mint role NFT');
        } finally {
            setIsMinting(false);
        }
    }, [project?.id, canSubmit, connectedWallet?.wallet, mintRecipient, defaultRecipient, newRole, project?.name, mintImageUrl, mintPolicy, getRecipientFingerprints, addFingerprintViaApi]);

    const onUploadToPinata = useCallback(async () => {
        if (!mintImageFile) { setError('Choose an image to upload'); return; }
        try {
            setError(null);
            setIsUploading(true);
            const { ipfsUri } = await uploadImageToPinata({ file: mintImageFile });
            setMintImageUrl(ipfsUri);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    }, [mintImageFile]);

    return (
        <Modal isOpen={isOpen} title={project ? `Editors · ${project.name}` : 'Editors'} onClose={onClose}>
            {error && <div className={styles.error}>{error}</div>}
            {!canSubmit && (
                <div className={styles.muted}>Connect and verify a wallet to manage editors.</div>
            )}
            {project && (
                <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Add role by wallet (owner manages):</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                            </select>
                            <input value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="addr... or stake..." />
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={addWalletRole} disabled={!canSubmit}>Add Wallet Role</button>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Add role by NFT fingerprint:</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                            </select>
                            <input value={newFingerprint} onChange={(e) => setNewFingerprint(e.target.value)} placeholder="asset fingerprint (asset1...)" />
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={addFingerprintRole} disabled={!canSubmit}>Add Fingerprint Role</button>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Current roles</span>
                        {roles.length === 0 ? (
                            <div className={styles.muted}>None</div>
                        ) : (
                            <ul>
                                {roles.map((r) => (
                                    <li key={`${r.id}`}>
                                        {r.role} · {r.principal_type === 'wallet' ? formatAddressShort(r.stake_address || r.wallet_payment_address || '') : (r.fingerprint || '')}
                                        <button className={styles.secondary} onClick={() => removeRole(r)} disabled={!canSubmit}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Transfer ownership to wallet</span>
                        <input value={ownerWallet} onChange={(e) => setOwnerWallet(e.target.value)} placeholder="addr... or stake..." />
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={transferOwner} disabled={!canSubmit}>Transfer Owner</button>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Owner NFT fingerprints (comma-separated)</span>
                        <input value={ownerFingerprintCsv} onChange={(e) => setOwnerFingerprintCsv(e.target.value)} placeholder="asset fingerprints (comma-separated)" />
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={saveOwnerFingerprints} disabled={!canSubmit}>Save Owner Fingerprints</button>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Mint role NFT (Mesh)</span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                            </select>
                            <input value={mintRecipient} onChange={(e) => setMintRecipient(e.target.value)} placeholder="recipient addr..." />
                            <input value={mintImageUrl} onChange={(e) => setMintImageUrl(e.target.value)} placeholder="optional image url (ipfs:// or https://...)" />
                            <input type="file" accept="image/*" onChange={(e) => setMintImageFile(e.target.files?.[0] || null)} />
                            <button type="button" className={styles.secondary} onClick={onUploadToPinata} disabled={!canSubmit || isUploading || !mintImageFile}>{isUploading ? 'Uploading…' : 'Upload to Pinata'}</button>
                            <select value={mintPolicy} onChange={(e) => setMintPolicy(e.target.value as 'open' | 'closed')}>
                                <option value="open">Open policy</option>
                                <option value="closed">Closed (expires)</option>
                            </select>
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={onMintRoleNft} disabled={!canSubmit || isMinting}>{isMinting ? 'Minting…' : 'Mint Role NFT'}</button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}


