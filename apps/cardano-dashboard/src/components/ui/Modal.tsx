import React, { useEffect, useCallback } from 'react';
import styles from './Modal.module.css';

export type ModalProps = {
    isOpen: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
};

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
    const onKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onKeyDown]);

    if (!isOpen) return null;
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button type="button" className={styles.close} onClick={onClose}>Close</button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
}


