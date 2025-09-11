import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './ProjectEditorModal.module.css';
import type { ProjectRecord } from '@/types/projects';
import { useWallet } from '@/contexts/WalletContext';
import { mintRoleNft } from '@/lib/mint-role-nft';
import { uploadImageToPinata } from '@/utils/uploadImage';

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
    const [mintPolicy, setMintPolicy] = useState<'open' | 'closed'>('open');
    const [isMinting, setIsMinting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mintImageFile, setMintImageFile] = useState<File | null>(null);
    const { connectedWallet } = useWallet();

    const defaultRecipient = useMemo(() => connectedWallet?.address || '', [connectedWallet?.address]);

    useEffect(() => {
        if (!project?.id || !isOpen) {
            setError(null);
            setNewRole('editor');
            setMintRecipient('');
            setMintImageUrl('');
            setMintPolicy('open');
            setIsMinting(false);
            setIsUploading(false);
            setMintImageFile(null);
            return;
        }
        setMintRecipient(defaultRecipient);
    }, [project?.id, isOpen, defaultRecipient]);

    // Removed fingerprint polling in favor of immediate wallet role creation using txhash

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

    const onMintRoleNft = useCallback(async () => {
        setError(null);
        if (!project?.id) return;
        if (!canSubmit) return;
        if (!connectedWallet?.wallet) { setError('Connect a wallet to mint.'); return; }
        const recipient = (mintRecipient || defaultRecipient || '').trim();
        if (!recipient) { setError('Recipient address is required'); return; }
        try {
            setIsMinting(true);
            const { txHash } = await mintRoleNft({
                wallet: connectedWallet.wallet,
                recipientAddress: recipient,
                role: newRole,
                projectName: project.name,
                imageUrl: mintImageUrl || undefined,
                policyType: mintPolicy,
            });
            if (newRole === 'owner') {
                // Owners are managed on the project record via owner_nft_fingerprints, owner-only
                const resp = await fetch('/api/projects/owner-nft', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project_id: project.id,
                        wallet_address: recipient,
                        txhash: txHash,
                    }),
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to add owner NFT');
            } else {
                // Immediately create a wallet-based role using recipient address and txhash
                const resp = await fetch('/api/projects/roles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        project_id: project.id,
                        role: newRole,
                        principal_type: 'wallet',
                        wallet_address: recipient,
                        txhash: txHash,
                    }),
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to add wallet role');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to mint role NFT');
        } finally {
            setIsMinting(false);
        }
    }, [project?.id, canSubmit, connectedWallet?.wallet, mintRecipient, defaultRecipient, newRole, project?.name, mintImageUrl, mintPolicy]);

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
                                <option value="admin">admin</option>
                                <option value="owner">owner</option>
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


