import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import { formatAddressShort } from '@/utils/address';
import type { ProjectRecord } from '@/types/projects';
// wallet context not needed in editors view now

export type EditorsModalProps = {
    isOpen: boolean;
    project: ProjectRecord | null;
    canSubmit: boolean;
    onClose: () => void;
};

type RoleItem = { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy' | 'nft_fingerprint' | 'nft_unit'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null; fingerprint?: string | null; unit?: string | null };

export function EditorsModal({ isOpen, project, canSubmit, onClose }: EditorsModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [newWallet, setNewWallet] = useState('');
    const [newFingerprint, setNewFingerprint] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
    const [ownerWallet, setOwnerWallet] = useState('');
    const [ownerFingerprintCsv, setOwnerFingerprintCsv] = useState('');
    // no wallet interactions needed here


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
            setOwnerFingerprintCsv((project.owner_nft_units ?? []).join(', '));
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
                setOwnerFingerprintCsv((project.owner_nft_units ?? []).join(', '));
            } catch {
                setRoles([]);
            }
        })();
    }, [project, isOpen, canSubmit]);

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
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'nft_unit', unit: newFingerprint.trim() }),
            });
            const data: { role?: RoleItem; error?: string } = await resp.json().catch(() => ({}) as { role?: RoleItem; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add unit role');
            setNewFingerprint('');
            if (data.role) setRoles((prev) => prev.concat(data.role as RoleItem));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add unit role');
        }
    }, [project?.id, newFingerprint, newRole]);

    const removeRole = useCallback(async (r: { role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy' | 'nft_fingerprint' | 'nft_unit'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null; fingerprint?: string | null; unit?: string | null }) => {
        if (!project?.id) return;
        try {
            const params = new URLSearchParams({ project_id: project.id, role: r.role, principal_type: r.principal_type });
            if (r.principal_type === 'wallet') {
                params.set('wallet_address', r.stake_address || r.wallet_payment_address || '');
            } else if (r.principal_type === 'nft_fingerprint') {
                params.set('fingerprint', r.fingerprint || '');
            } else if (r.principal_type === 'nft_unit') {
                params.set('unit', r.unit || '');
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
                } else if (r.principal_type === 'nft_fingerprint') {
                    return !(x.fingerprint && r.fingerprint && x.fingerprint === r.fingerprint);
                } else {
                    return !(x.unit && r.unit && x.unit === r.unit);
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
                body: JSON.stringify({ id: project.id, owner_nft_units: ownerFingerprintCsv.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to save owner units');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save owner units');
        }
    }, [project?.id, ownerFingerprintCsv]);

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
                        <span>Add role by NFT unit:</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                            </select>
                            <input value={newFingerprint} onChange={(e) => setNewFingerprint(e.target.value)} placeholder="unit (policyid + assetNameHex)" />
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={addFingerprintRole} disabled={!canSubmit}>Add Unit Role</button>
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
                                        {r.role} · {r.principal_type === 'wallet' ? formatAddressShort(r.stake_address || r.wallet_payment_address || '') : (r.fingerprint || r.unit || '')}
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
                        <span>Owner NFT units (comma-separated)</span>
                        <input value={ownerFingerprintCsv} onChange={(e) => setOwnerFingerprintCsv(e.target.value)} placeholder="asset units (comma-separated)" />
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={saveOwnerFingerprints} disabled={!canSubmit}>Save Owner Fingerprints</button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}


