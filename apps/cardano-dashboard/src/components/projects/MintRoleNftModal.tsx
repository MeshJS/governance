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
    const [mintPolicy, setMintPolicy] = useState<'open' | 'closed'>('open');
    const [isMinting, setIsMinting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState<'self' | 'send'>('self');
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [isLoadingExistingImages, setIsLoadingExistingImages] = useState(false);
    const [imageMode, setImageMode] = useState<'existing' | 'url' | 'upload'>('url');
    const [isMintComplete, setIsMintComplete] = useState(false);
    const [mintedTxHash, setMintedTxHash] = useState<string | null>(null);
    const [mintedUnit, setMintedUnit] = useState<string | null>(null);

    const { connectedWallet, getUnits } = useWallet();
    const [units, setUnits] = useState<string[]>([]);

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
            setDeliveryMode('self');
            setUnits([]);
            setExistingImageUrls([]);
            setIsLoadingExistingImages(false);
            setImageMode('url');
            setIsMintComplete(false);
            setMintedTxHash(null);
            setMintedUnit(null);
            return;
        }
        (async () => {
            try {
                const walletUnits = await getUnits().catch(() => [] as string[]);
                setUnits(Array.isArray(walletUnits) ? walletUnits : []);
            } catch { setUnits([]); }
            // Load existing image URLs for this project's roles
            try {
                setIsLoadingExistingImages(true);
                const resp = await fetch(`/api/projects/roles?project_id=${project.id}`);
                const data = await resp.json().catch(() => ({} as { roles?: Array<{ image_url?: string | null }> }));
                if (resp.ok && Array.isArray((data as { roles?: Array<{ image_url?: string | null }> }).roles)) {
                    const urls = ((data as { roles?: Array<{ image_url?: string | null }> }).roles || [])
                        .map(r => (r?.image_url || '').trim())
                        .filter(u => !!u) as string[];
                    const unique = Array.from(new Set(urls));
                    setExistingImageUrls(unique);
                    setImageMode(unique.length > 0 ? 'existing' : 'url');
                } else {
                    setExistingImageUrls([]);
                }
            } catch {
                setExistingImageUrls([]);
            } finally {
                setIsLoadingExistingImages(false);
            }
        })();
    }, [project?.id, isOpen, getUnits]);

    // Removed fingerprint polling in favor of immediate wallet role creation using txhash

    const onUploadToPinata = useCallback(async (file: File) => {
        try {
            setError(null);
            setIsUploading(true);
            const { ipfsUri } = await uploadImageToPinata({ file });
            setMintImageUrl(ipfsUri);
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
        const recipient = (deliveryMode === 'self' ? (defaultRecipient || '') : mintRecipient).trim();
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
                    image_url: mintImageUrl || undefined,
                    nft_units: units.join(','),
                }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error((data as { error?: string })?.error || 'Failed to add wallet role');
            setMintedTxHash(txHash ?? null);
            setMintedUnit(unit ?? null);
            setIsMintComplete(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to mint role NFT');
        } finally {
            setIsMinting(false);
        }
    }, [project?.id, canSubmit, connectedWallet?.wallet, mintRecipient, defaultRecipient, newRole, project?.name, mintImageUrl, mintPolicy, deliveryMode, units]);

    const onMintAnother = useCallback(() => {
        setError(null);
        setIsMintComplete(false);
        setMintedTxHash(null);
        setMintedUnit(null);
        setNewRole('editor');
        setDeliveryMode('self');
        setMintRecipient('');
        setMintImageUrl('');
        setMintPolicy('open');
        setIsMinting(false);
        setIsUploading(false);
        setImageMode(existingImageUrls.length > 0 ? 'existing' : 'url');
    }, [existingImageUrls.length]);

    const isRecipientValid = useMemo(() => {
        if (deliveryMode === 'self') return true;
        return mintRecipient.trim().length > 0;
    }, [deliveryMode, mintRecipient]);

    const isImageValid = useMemo(() => {
        if (imageMode === 'existing') return !!mintImageUrl;
        if (imageMode === 'url') {
            const v = mintImageUrl.trim();
            return v.startsWith('ipfs://') || v.startsWith('https://');
        }
        if (imageMode === 'upload') return !!mintImageUrl;
        return false;
    }, [imageMode, mintImageUrl]);

    const isFormValid = useMemo(() => {
        return canSubmit && !isMinting && !isUploading && isRecipientValid && isImageValid;
    }, [canSubmit, isMinting, isUploading, isRecipientValid, isImageValid]);

    return (
        <Modal isOpen={isOpen} title={project ? `Mint Role NFT · ${project.name}` : 'Mint Role NFT'} onClose={onClose}>
            {error && <div className={styles.error}>{error}</div>}
            {!canSubmit && (
                <div className={styles.muted}>Connect and verify a wallet to mint role NFTs.</div>
            )}
            {project && (
                <div className={styles.gridNarrow} style={{ gridColumn: '1 / -1' }}>
                    {isMintComplete ? (
                        <>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <h3 className={styles.sectionTitle}>Minting complete</h3>
                                <div className={styles.previewCard}>
                                    <div className={styles.muted}>Your role NFT was minted successfully.</div>
                                    {mintedUnit && (
                                        <div style={{ marginTop: 6 }}>
                                            <span className={styles.badge}>Unit</span>
                                            <div className={styles.principal}>{mintedUnit}</div>
                                        </div>
                                    )}
                                    {mintedTxHash && (
                                        <div style={{ marginTop: 6 }}>
                                            <span className={styles.badge}>Tx hash</span>
                                            <div className={styles.principal}>{mintedTxHash}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.actions} style={{ gridColumn: '1 / -1' }}>
                                <button type="button" className={styles.primary} onClick={onMintAnother}>Mint another</button>
                                <button type="button" className={styles.secondary} onClick={onClose}>Close</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <h3 className={styles.sectionTitle}>Mint Role NFT</h3>
                                <div className={styles.muted}>Choose a role, delivery, optional image, and policy.</div>
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.statusRow}>
                                    <span>Role</span>
                                    <span className={styles.badgeOk}>Selected</span>
                                </div>
                                <select className={styles.controlWide} value={newRole} onChange={(e) => setNewRole(e.target.value as 'admin' | 'editor' | 'owner')}>
                                    <option value="editor">editor</option>
                                    <option value="admin">admin</option>
                                    <option value="owner">owner</option>
                                </select>
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.statusRow}>
                                    <span>Minting policy</span>
                                    <span className={styles.badgeOk}>Selected</span>
                                </div>
                                <select className={styles.controlWide} value={mintPolicy} onChange={(e) => setMintPolicy(e.target.value as 'open' | 'closed')}>
                                    <option value="open">Open policy</option>
                                    <option value="closed">Closed (expires)</option>
                                </select>
                            </div>

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.statusRow}>
                                    <span>Delivery</span>
                                    {isRecipientValid ? (
                                        <span className={styles.badgeOk}>Complete</span>
                                    ) : (
                                        <span className={styles.badge}>Required</span>
                                    )}
                                </div>
                                <select className={styles.controlWide} value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value as 'self' | 'send')} disabled={!canSubmit || isMinting || isUploading}>
                                    <option value="self">Mint to connected wallet</option>
                                    <option value="send">Mint and send to another wallet</option>
                                </select>
                                <div className={styles.muted}>
                                    Connected wallet: {defaultRecipient ? `${defaultRecipient.slice(0, 12)}…${defaultRecipient.slice(-6)}` : '—'}
                                </div>
                            </div>

                            {deliveryMode === 'send' && (
                                <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                    <span>Recipient address</span>
                                    <input className={styles.controlWide} value={mintRecipient} onChange={(e) => setMintRecipient(e.target.value)} placeholder="addr1..." />
                                    <div className={styles.muted}>Enter a valid Cardano address to receive the minted NFT.</div>
                                </div>
                            )}

                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.statusRow}>
                                    <span>Image</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {isImageValid ? (
                                            <span className={styles.badgeOk}>Complete</span>
                                        ) : (
                                            <span className={styles.badge}>Required</span>
                                        )}
                                        {mintImageUrl && (
                                            <button
                                                type="button"
                                                className={styles.linkButton}
                                                onClick={() => { setMintImageUrl(''); }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.radioRow}>
                                    <label className={styles.radioItem}>
                                        <input type="radio" name="imageMode" value="existing" checked={imageMode === 'existing'} onChange={() => setImageMode('existing')} />
                                        <span>Select from existing images</span>
                                    </label>
                                    <label className={styles.radioItem}>
                                        <input type="radio" name="imageMode" value="url" checked={imageMode === 'url'} onChange={() => setImageMode('url')} />
                                        <span>Provide URL</span>
                                    </label>
                                    <label className={styles.radioItem}>
                                        <input type="radio" name="imageMode" value="upload" checked={imageMode === 'upload'} onChange={() => setImageMode('upload')} />
                                        <span>Upload file</span>
                                    </label>
                                </div>
                                {imageMode === 'existing' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                                        <div style={{ width: '100%' }}>
                                            {isLoadingExistingImages && (
                                                <div className={styles.muted}>Loading images…</div>
                                            )}
                                            {!!existingImageUrls.length ? (
                                                <div className={styles.thumbGrid} aria-label="Existing images">
                                                    <button
                                                        type="button"
                                                        key="__none"
                                                        className={`${styles.thumbItem} ${!mintImageUrl ? styles.thumbSelected : ''}`}
                                                        onClick={() => { setMintImageUrl(''); }}
                                                        disabled={!canSubmit || isMinting || isUploading}
                                                        title="No image"
                                                        aria-label="Deselect image"
                                                        aria-pressed={!mintImageUrl}
                                                    >
                                                        <div className={styles.thumbNone}>None</div>
                                                    </button>
                                                    {existingImageUrls.map((url) => {
                                                        const isSelected = mintImageUrl === url;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={url}
                                                                className={`${styles.thumbItem} ${isSelected ? styles.thumbSelected : ''}`}
                                                                onClick={() => { setMintImageUrl(isSelected ? '' : url); }}
                                                                disabled={!canSubmit || isMinting || isUploading}
                                                                title={url}
                                                                aria-label="Select existing image"
                                                                aria-pressed={isSelected}
                                                            >
                                                                <img src={url} alt="" className={styles.thumbImage} />
                                                                {isSelected && <span className={styles.thumbMark}>✓</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className={styles.muted}>No existing images found for this project.</div>
                                            )}
                                        </div>
                                        <div className={styles.previewWrap}>
                                            <div style={{ width: 160, height: 160 }}>
                                                <div className={styles.previewCard} style={{ width: '100%', height: '100%' }}>
                                                    {mintImageUrl ? (
                                                        <img src={mintImageUrl} alt="Preview" className={styles.previewImageSquare} />
                                                    ) : (
                                                        <div className={styles.muted}>No image selected</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.previewCaption}>Role: {newRole}</div>
                                        </div>
                                    </div>
                                )}
                                {imageMode === 'url' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
                                                <input className={styles.controlWide} value={mintImageUrl} onChange={(e) => { setMintImageUrl(e.target.value); }} placeholder="ipfs://... or https://..." />
                                                {!mintImageUrl && <div className={styles.muted}>Provide an image URL.</div>}
                                            </div>
                                        </div>
                                        <div className={styles.previewWrap}>
                                            <div style={{ width: 160, height: 160 }}>
                                                <div className={styles.previewCard} style={{ width: '100%', height: '100%' }}>
                                                    {mintImageUrl ? (
                                                        <img src={mintImageUrl} alt="Preview" className={styles.previewImageSquare} />
                                                    ) : (
                                                        <div className={styles.muted}>No image selected</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.previewCaption}>Role: {newRole}</div>
                                        </div>
                                    </div>
                                )}
                                {imageMode === 'upload' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
                                                <input
                                                    className={styles.controlWide}
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
                                                {!mintImageUrl && <div className={styles.muted}>{isUploading ? 'Uploading…' : 'Upload an image file.'}</div>}
                                            </div>
                                        </div>
                                        <div className={styles.previewWrap}>
                                            <div style={{ width: 160, height: 160 }}>
                                                <div className={styles.previewCard} style={{ width: '100%', height: '100%' }}>
                                                    {mintImageUrl ? (
                                                        <img src={mintImageUrl} alt="Preview" className={styles.previewImageSquare} />
                                                    ) : (
                                                        <div className={styles.muted}>No image selected</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.previewCaption}>Role: {newRole}</div>
                                        </div>
                                    </div>
                                )}
                            </div>



                            <div className={styles.stickyFooter} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.actionsCentered} style={{ alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        className={styles.cta}
                                        onClick={onMintRoleNft}
                                        disabled={!isFormValid}
                                    >
                                        {isUploading ? 'Uploading image…' : (isMinting ? `Minting ${newRole}…` : `Mint ${newRole}`)}
                                    </button>
                                    <span className={isFormValid ? styles.badgeOk : styles.badge}>{isFormValid ? 'Ready to mint' : 'Complete required sections'}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Modal>
    );
}


