import { FC } from 'react';
import styles from '../styles/Proposals.module.css';
import projectStyles from '../styles/ProjectDetail.module.css';
import { CatalystProject } from '../types';
import Link from 'next/link';

// Simple number formatting function that doesn't rely on locale settings
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format ADA amount with symbol
const formatAda = (amount: number): string => {
  return `₳ ${formatNumber(amount)}`;
};

// Calculate progress percentage safely
const calculateProgress = (completed: number, total: number): number => {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
};

// Determine project status based on milestone completion
const getProjectStatus = (
  milestonesCompleted: number,
  totalMilestones: number
): 'Completed' | 'In Progress' => {
  if (milestonesCompleted >= totalMilestones && totalMilestones > 0) {
    return 'Completed';
  }
  return 'In Progress';
};

// Get funding round from category (e.g., "Fund 10")
const getFundingRound = (category: string): string => {
  const match = category.match(/Fund \d+/i);
  return match ? match[0] : category;
};

interface MeshSDKProposalCardProps {
  project: CatalystProject;
  compact?: boolean;
}

const MeshSDKProposalCard: FC<MeshSDKProposalCardProps> = ({ project, compact = false }) => {
  const progressPercent = calculateProgress(
    project.milestonesCompleted,
    project.projectDetails.milestones_qty
  );
  const projectStatus = getProjectStatus(
    project.milestonesCompleted,
    project.projectDetails.milestones_qty
  );
  
  const proposalUrl = `/catalyst-proposals/${project.projectDetails.project_id}`;

  return (
    <Link 
      href={proposalUrl}
      className={`${styles.card} ${projectStyles.proposalCard} ${compact ? projectStyles.compactCard : ''} ${styles.clickable}`}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardHeader}>
          <span
            className={`${styles.status} ${
              projectStatus === 'Completed'
                ? styles.statusCompleted
                : projectStatus === 'In Progress'
                  ? styles.statusInProgress
                  : styles.statusPending
            }`}
          >
            {projectStatus}
          </span>
          <h3 className={styles.title}>{project.projectDetails.title}</h3>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Fund</span>
              <span className={styles.infoValue}>
                {getFundingRound(project.projectDetails.category)}
              </span>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Budget</span>
              <span className={styles.infoValue}>
                {formatAda(project.projectDetails.budget)}
              </span>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Distributed</span>
              <span className={styles.infoValue}>
                {formatAda(project.projectDetails.funds_distributed)}
              </span>
            </div>

            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Milestones</span>
              <span className={styles.infoValue}>
                {project.milestonesCompleted ?? 0}/{project.projectDetails.milestones_qty}
              </span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      progressPercent === 100
                        ? 'linear-gradient(90deg, rgba(56, 232, 225, 0.25), rgba(56, 232, 225, 0.35))'
                        : progressPercent > 50
                          ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.25))'
                          : 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.15))',
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.projectIdBox}>
            <span className={styles.projectIdLabel}>Project ID</span>
            <span className={styles.projectIdValue}>
              {project.projectDetails.project_id}
            </span>
          </div>
        </div>

        <div className={styles.cardActions}>
          <div className={styles.actionButton}>
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MeshSDKProposalCard;
