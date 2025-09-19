import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import { getClientCsrfToken } from '@/utils/csrf';
import { formatAddressShort } from '@/utils/address';
import type { ProjectRecord } from '@/types/projects';
import { useWallet } from '@/contexts/WalletContext';

export type EditorsModalProps = {
    isOpen: boolean;
    project: ProjectRecord | null;
    canSubmit: boolean;
    onClose: () => void;
};

type RoleItem = { id: string; role: 'owner' | 'admin' | 'editor'; principal_type: 'wallet' | 'nft_unit'; wallet_payment_address?: string | null; stake_address?: string | null; unit?: string | null };

export function EditorsModal({ isOpen, project, canSubmit, onClose }: EditorsModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [newWallet, setNewWallet] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [newRole, setNewRole] = useState<'admin' | 'editor' | 'owner'>('editor');
    const { getUnits, connectedWallet } = useWallet();
    const [units, setUnits] = useState<string[]>([]);


    useEffect(() => {
        if (!project?.id || !isOpen) {
            setRoles([]);
            setNewWallet('');
            setNewUnit('');
            setNewRole('editor');
            setError(null);
            setUnits([]);
            return;
        }
        (async () => {
            try {
                const walletUnits = await getUnits().catch(() => [] as string[]);
                setUnits(Array.isArray(walletUnits) ? walletUnits : []);
                const params = new URLSearchParams({ project_id: project.id });
                if (Array.isArray(walletUnits) && walletUnits.length > 0) {
                    params.set('nft_units', walletUnits.join(','));
                }
                const rolesResp = await fetch(`/api/projects/roles?${params.toString()}`);
                if (rolesResp.ok) {
                    const data: { roles?: RoleItem[] } = await rolesResp.json();
                    setRoles((data?.roles ?? []));
                } else {
                    setRoles([]);
                }
            } catch {
                setRoles([]);
            }
        })();
    }, [project, isOpen, canSubmit, getUnits]);

    // Determine permissions via roles data we fetched
    const callerAddress = connectedWallet?.address || '';
    const lowerUnits = new Set(units.map((u) => (u || '').toLowerCase()));
    const isOwner = roles.some((r) => {
        if (r.role !== 'owner') return false;
        if (r.principal_type === 'wallet') {
            return !!callerAddress && (r.wallet_payment_address === callerAddress || r.stake_address === callerAddress);
        }
        if (r.principal_type === 'nft_unit') {
            const u = (r.unit || '').toLowerCase();
            return !!u && lowerUnits.has(u);
        }
        return false;
    });

    // admin status is computed server-side for authorization; we only derive owner locally for UI

    // If not owner, force newRole to editor
    useEffect(() => {
        if (isOpen && !isOwner && newRole !== 'editor') {
            setNewRole('editor');
        }
    }, [isOpen, isOwner, newRole]);

    const addWalletRole = useCallback(async () => {
        if (!project?.id || !newWallet.trim()) return;
        try {
            const csrf = getClientCsrfToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (csrf) headers['X-CSRF-Token'] = csrf;
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers,
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'wallet', wallet_address: newWallet.trim(), nft_units: units.join(',') }),
            });
            const data: { role?: RoleItem; error?: string } = await resp.json().catch(() => ({}) as { role?: RoleItem; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add wallet role');
            setNewWallet('');
            if (data.role) setRoles((prev) => prev.concat(data.role as RoleItem));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add wallet role');
        }
    }, [project?.id, newWallet, newRole, units]);

    const addUnitRole = useCallback(async () => {
        if (!project?.id || !newUnit.trim()) return;
        try {
            const csrf = getClientCsrfToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (csrf) headers['X-CSRF-Token'] = csrf;
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers,
                body: JSON.stringify({ project_id: project.id, role: newRole, principal_type: 'nft_unit', unit: newUnit.trim(), nft_units: units.join(',') }),
            });
            const data: { role?: RoleItem; error?: string } = await resp.json().catch(() => ({}) as { role?: RoleItem; error?: string });
            if (!resp.ok) throw new Error(data?.error || 'Failed to add unit role');
            setNewUnit('');
            if (data.role) setRoles((prev) => prev.concat(data.role as RoleItem));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to add unit role');
        }
    }, [project?.id, newUnit, newRole, units]);

    const removeRole = useCallback(async (r: RoleItem) => {
        if (!project?.id) return;
        const principal = r.principal_type === 'wallet' ? (r.stake_address || r.wallet_payment_address || '') : (r.unit || '');
        const short = formatAddressShort(principal);
        if (!confirm(`Remove ${r.role} (${r.principal_type}) · ${short}?`)) return;
        try {
            const params = new URLSearchParams({ project_id: project.id, role: r.role, principal_type: r.principal_type });
            if (r.principal_type === 'wallet') {
                params.set('wallet_address', r.stake_address || r.wallet_payment_address || '');
            } else if (r.principal_type === 'nft_unit') {
                params.set('unit', r.unit || '');
            }
            if (units.length > 0) params.set('nft_units', units.join(','));
            const csrf = getClientCsrfToken();
            const headers: Record<string, string> = {};
            if (csrf) headers['X-CSRF-Token'] = csrf;
            const resp = await fetch(`/api/projects/roles?${params.toString()}`, { method: 'DELETE', headers });
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
                    return !(x.unit && r.unit && x.unit === r.unit);
                }
            }));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to remove role');
        }
    }, [project?.id, units]);



    return (
        <Modal isOpen={isOpen} title={project ? `Editors · ${project.name}` : 'Editors'} onClose={onClose}>
            {error && <div className={styles.error}>{error}</div>}
            {!canSubmit && (
                <div className={styles.muted}>Connect and verify a wallet to manage editors.</div>
            )}
            {project && (
                <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Add role by wallet (owner/admin manages):</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor' | 'owner')}>
                                <option value="editor">editor</option>
                                {isOwner && <option value="admin">admin</option>}
                                {isOwner && <option value="owner">owner</option>}
                            </select>
                            <input value={newWallet} onChange={(e) => setNewWallet(e.target.value)} placeholder="addr... or stake..." />
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={addWalletRole} disabled={!canSubmit}>Add Role by wallet</button>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Add role by NFT unit (policyid + assetNameHex):</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor' | 'owner')}>
                                <option value="editor">editor</option>
                                {isOwner && <option value="admin">admin</option>}
                                {isOwner && <option value="owner">owner</option>}
                            </select>
                            <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="unit (policyid + assetNameHex)" />
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={addUnitRole} disabled={!canSubmit}>Add Role by token Unit</button>
                        </div>
                    </div>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Current roles</span>
                        {/* Owners list (visible only to owners) */}
                        {isOwner && (
                            <div className={styles.ownerBlock}>
                                <div className={styles.muted} style={{ marginBottom: 6 }}>Owners</div>
                                <ul className={styles.roleList}>
                                    {roles.filter((r) => r.role === 'owner').map((r) => (
                                        <li key={`owner-${r.id}`} className={styles.roleItem}>
                                            <div className={styles.roleMeta}>
                                                <span className={styles.badge}>owner</span>
                                                <span className={styles.typeBadge}>{r.principal_type === 'wallet' ? 'wallet' : 'nft'}</span>
                                                <span className={styles.principal}>
                                                    {r.principal_type === 'wallet' ? formatAddressShort(r.stake_address || r.wallet_payment_address || '') : formatAddressShort(r.unit || '')}
                                                </span>
                                            </div>
                                            <button className={styles.secondary} onClick={() => removeRole(r)} disabled={!canSubmit}>Remove</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Admin/Editor roles */}
                        {(() => {
                            const visible = isOwner ? roles.filter((r) => r.role !== 'owner') : roles.filter((r) => r.role === 'editor');
                            return (
                                <div className={styles.ownerBlock}>
                                    <div className={styles.muted} style={{ marginBottom: 6 }}>{isOwner ? 'Admins & editors' : 'Editors'}</div>
                                    {visible.length === 0 ? (
                                        <div className={styles.muted}>None</div>
                                    ) : (
                                        <ul className={styles.roleList}>
                                            {visible.map((r) => (
                                                <li key={`${r.id}`} className={styles.roleItem}>
                                                    <div className={styles.roleMeta}>
                                                        <span className={styles.badge}>{r.role}</span>
                                                        <span className={styles.typeBadge}>{r.principal_type === 'wallet' ? 'wallet' : 'nft'}</span>
                                                        <span className={styles.principal}>
                                                            {r.principal_type === 'wallet' ? formatAddressShort(r.stake_address || r.wallet_payment_address || '') : formatAddressShort(r.unit || '')}
                                                        </span>
                                                    </div>
                                                    <button className={styles.secondary} onClick={() => removeRole(r)} disabled={!canSubmit}>Remove</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                </div>
            )}
        </Modal>
    );
}


