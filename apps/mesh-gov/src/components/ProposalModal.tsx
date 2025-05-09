import { useEffect, useRef, useState } from 'react';
import styles from '../styles/ProposalModal.module.css';

interface ProposalModalProps {
    proposal: {
        proposalId: string;
        proposalTxHash: string;
        proposalIndex: number;
        voteTxHash: string;
        blockTime: string;
        vote: 'Yes' | 'No' | 'Abstain';
        metaUrl: string | null;
        metaHash: string | null;
        proposalTitle: string;
        proposalType: string;
        proposedEpoch: number;
        expirationEpoch: number;
        rationale: string;
    };
    onClose: () => void;
}

export default function ProposalModal({ proposal, onClose }: ProposalModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [copiedHash, setCopiedHash] = useState<string | null>(null);
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const truncateHash = (hash: string) => {
        if (!isSmallScreen) return hash;
        return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
    };

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedHash(text);
            setTimeout(() => setCopiedHash(null), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!modalRef.current) return;
        const rect = modalRef.current.getBoundingClientRect();
        modalRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        modalRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth <= 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                ref={modalRef}
                onClick={e => e.stopPropagation()}
                onMouseMove={handleMouseMove}
            >
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    type="button"
                    aria-label="Close modal"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Proposal Title</h3>
                        <p className={styles.proposalTitle}>{proposal.proposalTitle}</p>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Proposal Details</h3>
                        <div className={styles.metadata}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Type</span>
                                <span className={styles.metaValue}>{proposal.proposalType}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Proposal ID</span>
                                <span className={styles.metaValue}>{proposal.proposalId}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Epochs</span>
                                <div className={styles.epochsWrapper}>
                                    <div className={styles.epoch}>
                                        <span className={styles.epochLabel}>Proposed</span>
                                        <span className={styles.epochValue}>{proposal.proposedEpoch}</span>
                                    </div>
                                    <div className={styles.epoch}>
                                        <span className={styles.epochLabel}>Expires</span>
                                        <span className={styles.epochValue}>{proposal.expirationEpoch}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Mesh DRep Vote Rationale</h3>
                        <p className={styles.rationale}>{proposal.rationale}</p>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Mesh DRep Vote</h3>
                        <span className={`${styles.vote} ${styles[proposal.vote.toLowerCase()]}`}>
                            {proposal.vote}
                        </span>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Actions</h3>
                        <div className={styles.actions}>
                            <a
                                href={`https://adastat.net/governances/${proposal.proposalTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.actionButton}
                                onClick={e => e.stopPropagation()}
                            >
                                View Proposal
                            </a>
                            <a
                                href={`https://adastat.net/transactions/${proposal.voteTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.actionButton}
                                onClick={e => e.stopPropagation()}
                            >
                                View Vote
                            </a>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Transaction Details</h3>
                        <div className={styles.txDetails}>
                            <div className={styles.txItem}>
                                <span className={styles.txLabel}>Proposal Tx</span>
                                <div className={styles.txCopyWrapper}>
                                    <code className={styles.txHash}>{truncateHash(proposal.proposalTxHash)}</code>
                                    <button
                                        className={styles.copyButton}
                                        onClick={() => handleCopy(proposal.proposalTxHash)}
                                        title="Copy transaction hash"
                                    >
                                        {copiedHash === proposal.proposalTxHash ? (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                                <path d="M13.5 4.5l-7 7L3 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                                <rect x="4" y="4" width="8" height="8" strokeWidth="1.5" />
                                                <path d="M11 4V3H5v1M11 13v1H5v-1" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.txItem}>
                                <span className={styles.txLabel}>Vote Tx</span>
                                <div className={styles.txCopyWrapper}>
                                    <code className={styles.txHash}>{truncateHash(proposal.voteTxHash)}</code>
                                    <button
                                        className={styles.copyButton}
                                        onClick={() => handleCopy(proposal.voteTxHash)}
                                        title="Copy transaction hash"
                                    >
                                        {copiedHash === proposal.voteTxHash ? (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                                <path d="M13.5 4.5l-7 7L3 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
                                                <rect x="4" y="4" width="8" height="8" strokeWidth="1.5" />
                                                <path d="M11 4V3H5v1M11 13v1H5v-1" strokeWidth="1.5" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {proposal.metaUrl && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Additional Resources</h3>
                            <a
                                href={proposal.metaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.resourceLink}
                                onClick={e => e.stopPropagation()}
                            >
                                View Proposal Details
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 