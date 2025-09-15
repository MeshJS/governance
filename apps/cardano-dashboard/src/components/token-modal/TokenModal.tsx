import React, { useEffect } from 'react';
import styles from './TokenModal.module.css';

export type TokenModalItem = {
    unit: string;
    displayName: string;
    imageUrl?: string | null;
    amountText?: string;
};

export interface TokenModalProps {
    isOpen: boolean;
    title: string;
    variant: 'fungible' | 'nft';
    items: TokenModalItem[];
    onClose: () => void;
}

export function TokenModal({ isOpen, title, variant, items, onClose }: TokenModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
                </div>
                <div className={styles.body}>
                    <ul className={`${styles.grid} ${variant === 'fungible' ? styles.fungibleGrid : styles.nftGrid}`}>
                        {items.map((it) => (
                            <li key={it.unit} className={styles.item} title={it.displayName}>
                                {it.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={it.imageUrl} alt={it.displayName} className={variant === 'fungible' ? styles.tokenImage : styles.nftImage} />
                                ) : (
                                    <div className={variant === 'fungible' ? styles.tokenImage : styles.nftImage} />
                                )}
                                {variant === 'fungible' && it.amountText ? (
                                    <span className={styles.amountBadge}>{it.amountText}</span>
                                ) : null}
                                <div className={styles.name}>{it.displayName}</div>
                            </li>
                        ))}
                    </ul>
                    {items.length === 0 && <div className={styles.empty}>No items.</div>}
                </div>
            </div>
        </div>
    );
}

export default TokenModal;


