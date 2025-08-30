import React from 'react';
import Image from 'next/image';
import styles from './NewProposalCard.module.css';

interface NewProposalCardProps {
  title: string;
  description: string;
  category: string;
  budget: number;
  milestones: string;
  status?: 'Draft' | 'Under Review' | 'Voting' | 'Approved' | 'Rejected' | 'Proposed';
  fundRound?: string;
  image?: string;
  onClick?: () => void;
}

export default function NewProposalCard({
  title,
  description,
  category,
  budget,
  milestones,
  status = 'Draft',
  fundRound,
  image = 'new-wallet.png',
  onClick,
}: NewProposalCardProps) {
  const formatBudget = (amount: number): string => {
    return `₳${amount.toLocaleString()}`;
  };

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'Draft':
        return styles.statusDraft;
      case 'Under Review':
        return styles.statusUnderReview;
      case 'Voting':
        return styles.statusVoting;
      case 'Approved':
        return styles.statusApproved;
      case 'Rejected':
        return styles.statusRejected;
      case 'Proposed':
        return styles.statusProposed;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardHeader}>
          <div className={styles.headerTop}>
            <span className={`${styles.status} ${getStatusStyle(status)}`}>{status}</span>
            {fundRound && <span className={styles.fundRound}>{fundRound}</span>}
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>

        <div className={styles.cardContent}>
          <p className={styles.description}>{description}</p>

          <div className={styles.imageContainer}>
            <img src={`/${image}`} alt="Proposal illustration" className={styles.cardImage} />
          </div>

          <div className={styles.infoGrid}>
            <div className={`${styles.infoBox} ${styles.categoryBox}`}>
              <span className={styles.infoLabel}>Category</span>
              <span className={styles.infoValue}>{category}</span>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Budget</span>
              <span className={styles.infoValue}>{formatBudget(budget)}</span>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Milestones</span>
              <span className={styles.infoValue}>{milestones}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
