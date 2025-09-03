import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import { formatAddressShort } from '@/utils/address';
import type { ProjectRecord } from '@/types/projects';

export type EditorsModalProps = {
    isOpen: boolean;
    project: ProjectRecord | null;
    canSubmit: boolean;
    onClose: () => void;
};

export function EditorsModal({ isOpen, project, canSubmit, onClose }: EditorsModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<{ id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }[]>([]);
    const [newWallet, setNewWallet] = useState('');
    const [newPolicy, setNewPolicy] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
    const [ownerWallet, setOwnerWallet] = useState('');
    const [ownerPolicyCsv, setOwnerPolicyCsv] = useState('');

    useEffect(() => {
        if (!project?.id || !isOpen) {
            setRoles([]);
            setNewWallet('');
            setNewPolicy('');
            setNewRole('editor');
            setOwnerWallet('');
            setOwnerPolicyCsv('');
            setError(null);
            return;
        }
        (async () => {
            try {
                const rolesResp = await fetch(`/api/projects/roles?project_id=${encodeURIComponent(project.id)}`);
                if (rolesResp.ok) {
                    const data: { roles?: { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }[] } = await rolesResp.json();
                    setRoles((data?.roles ?? []));
                } else {
                    setRoles([]);
                }
                setOwnerPolicyCsv((project.owner_nft_policy_ids ?? []).join(', '));
            } catch {
                setRoles([]);
            }
        })();
    }, [project?.id, isOpen, project?.owner_nft_policy_ids]);

    const addWalletRole = useCallback(async () => {
        if (!project?.id || !newWallet.trim()) return;
        try {
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'wallet', wallet_address: newWallet.trim() }),
            });
            const data: { role?: { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }; error?: string } = await resp.json().catch(() => ({}) as { role?: { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add wallet role');
            setNewWallet('');
            if (data.role) setRoles((prev) => prev.concat(data.role as { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add wallet role');
        }
    }, [project?.id, newWallet, newRole]);

    const addPolicyRole = useCallback(async () => {
        if (!project?.id || !newPolicy.trim()) return;
        try {
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'nft_policy', policy_id: newPolicy.trim() }),
            });
            const data: { role?: { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }; error?: string } = await resp.json().catch(() => ({}) as { role?: { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add policy role');
            setNewPolicy('');
            if (data.role) setRoles((prev) => prev.concat(data.role as { id: string; role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add policy role');
        }
    }, [project?.id, newPolicy, newRole]);

    const removeRole = useCallback(async (r: { role: 'admin' | 'editor'; principal_type: 'wallet' | 'nft_policy'; wallet_payment_address?: string | null; stake_address?: string | null; policy_id?: string | null }) => {
        if (!project?.id) return;
        try {
            const params = new URLSearchParams({ project_id: project.id, role: r.role, principal_type: r.principal_type });
            if (r.principal_type === 'wallet') {
                params.set('wallet_address', r.stake_address || r.wallet_payment_address || '');
            } else {
                params.set('policy_id', r.policy_id || '');
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
                    return !(x.policy_id && r.policy_id && x.policy_id === r.policy_id);
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

    const saveOwnerPolicy = useCallback(async () => {
        if (!project?.id) return;
        try {
            const resp = await fetch('/api/projects', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: project.id, owner_nft_policy_ids: ownerPolicyCsv.split(',').map((s) => s.trim()).filter(Boolean) }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to save owner policy');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save owner policy');
        }
    }, [project?.id, ownerPolicyCsv]);

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
                        <span>Add role by NFT policy ID:</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor')}>
                                <option value="editor">editor</option>
                                <option value="admin">admin</option>
                            </select>
                            <input value={newPolicy} onChange={(e) => setNewPolicy(e.target.value)} placeholder="policy id (hex)" />
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={addPolicyRole} disabled={!canSubmit}>Add Policy Role</button>
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
                                        {r.role} · {r.principal_type === 'wallet' ? formatAddressShort(r.stake_address || r.wallet_payment_address || '') : (r.policy_id || '')}
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
                        <span>Owner NFT policy IDs (comma-separated)</span>
                        <input value={ownerPolicyCsv} onChange={(e) => setOwnerPolicyCsv(e.target.value)} placeholder="policy ids (hex, comma-separated)" />
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={saveOwnerPolicy} disabled={!canSubmit}>Save Owner Policy</button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}


