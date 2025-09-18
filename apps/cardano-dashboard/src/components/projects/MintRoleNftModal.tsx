import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import type { ProjectRecord } from '@/types/projects';
import { useWallet } from '@/contexts/WalletContext';
import { mintRoleNft } from '@/lib/mint-role-nft';
import { uploadImageToPinata } from '@/utils/uploadImage';
import { getClientCsrfToken } from '@/utils/csrf';

export type MintRoleNftModalProps = {
    isOpen: boolean;
    project: ProjectRecord | null;
    canSubmit: boolean;
    onClose: () => void;
};

export function MintRoleNftModal({ isOpen, project, canSubmit, onClose }: MintRoleNftModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [newRole, setNewRole] = useState<'admin' | 'editor' | 'owner'>('editor');
    const [mintRecipient, setMintRecipient] = useState('');
    const [mintImageUrl, setMintImageUrl] = useState('');
    const [hasUploadedImage, setHasUploadedImage] = useState(false);
    const [mintPolicy, setMintPolicy] = useState<'open' | 'closed'>('open');
    const [isMinting, setIsMinting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [useMintingWallet, setUseMintingWallet] = useState(false);

    const { connectedWallet, getUnits } = useWallet();
    const [units, setUnits] = useState<string[]>([]);

    const defaultRecipient = useMemo(() => connectedWallet?.address || '', [connectedWallet?.address]);

    useEffect(() => {
        if (!project?.id || !isOpen) {
            setError(null);
            setNewRole('editor');
            setMintRecipient('');
            setMintImageUrl('');
            setHasUploadedImage(false);
            setMintPolicy('open');
            setIsMinting(false);
            setIsUploading(false);
            setUseMintingWallet(false);
            setUnits([]);
            return;
        }
        (async () => {
            try {
                const walletUnits = await getUnits().catch(() => [] as string[]);
                setUnits(Array.isArray(walletUnits) ? walletUnits : []);
            } catch { setUnits([]); }
        })();
    }, [project?.id, isOpen, getUnits]);

    // Removed fingerprint polling in favor of immediate wallet role creation using txhash

    const onUploadToPinata = useCallback(async (file: File) => {
        try {
            setError(null);
            setIsUploading(true);
            const { ipfsUri } = await uploadImageToPinata({ file });
            setMintImageUrl(ipfsUri);
            setHasUploadedImage(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    }, []);

    const onMintRoleNft = useCallback(async () => {
        setError(null);
        if (!project?.id) return;
        if (!canSubmit) return;
        if (!connectedWallet?.wallet) { setError('Connect a wallet to mint.'); return; }
        const recipient = (useMintingWallet ? (defaultRecipient || '') : mintRecipient).trim();
        if (!recipient) { setError('Recipient address is required'); return; }
        try {
            setIsMinting(true);
            const { txHash, unit } = await mintRoleNft({
                wallet: connectedWallet.wallet,
                recipientAddress: recipient,
                role: newRole,
                projectName: project.name,
                imageUrl: mintImageUrl || undefined,
                policyType: mintPolicy,
            });
            // Create a role using NFT unit and txhash (supports owner/admin/editor)
            const csrf = getClientCsrfToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (csrf) headers['X-CSRF-Token'] = csrf;
            const resp = await fetch('/api/projects/roles', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    project_id: project.id,
                    role: newRole,
                    principal_type: 'nft_unit',
                    unit,
                    txhash: txHash,
                    nft_units: units.join(','),
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to add wallet role');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to mint role NFT');
        } finally {
            setIsMinting(false);
        }
    }, [project?.id, canSubmit, connectedWallet?.wallet, mintRecipient, defaultRecipient, newRole, project?.name, mintImageUrl, mintPolicy, useMintingWallet, units]);

    return (
        <Modal isOpen={isOpen} title={project ? `Mint Role NFT · ${project.name}` : 'Mint Role NFT'} onClose={onClose}>
            {error && <div className={styles.error}>{error}</div>}
            {!canSubmit && (
                <div className={styles.muted}>Connect and verify a wallet to mint role NFTs.</div>
            )}
            {project && (
                <div className={styles.grid} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                        <span>Mint role NFT (Mesh)</span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor' | 'owner')}>
                                <option value="editor">editor</option>
                                {/* Owner/admin visibility is enforced server-side; keep UI simple */}
                                <option value="admin">admin</option>
                                <option value="owner">owner</option>
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                    type="checkbox"
                                    checked={useMintingWallet}
                                    onChange={(e) => setUseMintingWallet(e.target.checked)}
                                    disabled={!canSubmit || isMinting || isUploading}
                                />
                                <span>Send to minting wallet</span>
                            </label>
                            <input value={mintRecipient} onChange={(e) => setMintRecipient(e.target.value)} placeholder="recipient addr..." disabled={useMintingWallet} />
                            <input value={mintImageUrl} onChange={(e) => setMintImageUrl(e.target.value)} placeholder="optional image url (ipfs:// or https://...)" disabled={hasUploadedImage} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (file) {
                                        await onUploadToPinata(file);
                                    }
                                }}
                                disabled={!canSubmit || isUploading}
                            />
                            <select value={mintPolicy} onChange={(e) => setMintPolicy(e.target.value as 'open' | 'closed')}>
                                <option value="open">Open policy</option>
                                <option value="closed">Closed (expires)</option>
                            </select>
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.secondary} onClick={onMintRoleNft} disabled={!canSubmit || isMinting || isUploading}>{isMinting ? 'Minting…' : (isUploading ? 'Uploading image…' : 'Mint Role NFT')}</button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}


