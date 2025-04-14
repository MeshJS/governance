import { FC } from 'react';
import styles from '../styles/Proposals.module.css';
import { CatalystData, CatalystProject } from '../types';

// Simple number formatting function that doesn't rely on locale settings
const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Format ADA amount with symbol
const formatAda = (amount: number): string => {
    return `₳${formatNumber(amount)}`;
};

// Calculate progress percentage safely
const calculateProgress = (completed: number | undefined, total: number): number => {
    if (completed === undefined || total === 0) {
        return 0;
    }
    return Math.round((completed / total) * 100);
};

// Format title for URL
const formatTitleForUrl = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/&/g, 'and') // Replace & with 'and'
        .replace(/,/g, '') // Remove commas
        .replace(/[^\w\s-]/g, '') // Remove other special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
};

// Get funding round from category (first 3 characters)
const getFundingRound = (category: string): string => {
    return category.trim().substring(0, 3);
};

interface ProjectDetails {
    id: number;
    title: string;
    budget: number;
    milestones_qty: number;
    funds_distributed: number;
    project_id: number;
    category: string;
    status: string;
    finished: string;
}

interface Project {
    projectDetails: ProjectDetails;
    milestonesCompleted: number;
}

interface CatalystProposalsListProps {
    data: CatalystData;
    onRowClick?: (projectId: number) => void;
}

const CatalystProposalsList: FC<CatalystProposalsListProps> = ({ data, onRowClick }) => {
    // Calculate overall statistics
    const totalProjects = data.projects.length;
    const completedProjects = data.projects.filter(p => p.projectDetails.status === 'Completed').length;
    const inProgressProjects = data.projects.filter(p => p.projectDetails.status === 'In Progress').length;
    
    const totalBudget = data.projects.reduce((sum, p) => sum + p.projectDetails.budget, 0);
    const totalDistributed = data.projects.reduce((sum, p) => sum + p.projectDetails.funds_distributed, 0);
    
    const totalMilestones = data.projects.reduce((sum, p) => sum + p.projectDetails.milestones_qty, 0);
    const completedMilestones = data.projects.reduce((sum, p) => sum + (p.milestonesCompleted ?? 0), 0);
    
    // Calculate percentages
    const completionRate = Math.round((completedProjects / totalProjects) * 100);
    const distributionRate = Math.round((totalDistributed / totalBudget) * 100);
    const milestoneRate = Math.round((completedMilestones / totalMilestones) * 100);

    // Format the timestamp consistently using UTC to avoid timezone issues
    const formatDate = (timestamp: string): string => {
        const date = new Date(timestamp);
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours() % 12 || 12;
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const ampm = date.getUTCHours() >= 12 ? 'PM' : 'AM';

        return `${month}/${day}/${year}, ${hours}:${minutes} ${ampm} UTC`;
    };

    return (
        <>
            <div className={styles.milestoneOverview}>
                <h3 className={styles.milestoneOverviewTitle}>Project Milestones Progress</h3>
                <div className={styles.milestoneGrid}>
                    {data.projects.map((project) => {
                        const progressPercent = calculateProgress(project.milestonesCompleted, project.projectDetails.milestones_qty);
                        return (
                            <a
                                key={project.projectDetails.id}
                                href={`https://milestones.projectcatalyst.io/projects/${project.projectDetails.project_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.milestoneRow}
                            >
                                <div className={styles.milestoneInfo}>
                                    <div className={styles.milestoneTitle}>
                                        <span className={styles.fundTag}>{getFundingRound(project.projectDetails.category)}</span>
                                        <span className={styles.projectTitle}>{project.projectDetails.title}</span>
                                    </div>
                                    <div className={styles.milestoneCount}>
                                        {project.milestonesCompleted ?? 0}/{project.projectDetails.milestones_qty}
                                    </div>
                                </div>
                                <div className={styles.milestoneProgressBar}>
                                    <div 
                                        className={styles.milestoneProgressFill}
                                        style={{ 
                                            width: `${progressPercent}%`,
                                            background: progressPercent === 100 
                                                ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35))'
                                                : progressPercent > 50
                                                ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.25))'
                                                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.15))'
                                        }}
                                    />
                                </div>
                            </a>
                        );
                    })}
                </div>
            </div>

            <ul className={styles.list}>
                {data.projects.map((project) => {
                    // Calculate progress safely
                    const progressPercent = calculateProgress(project.milestonesCompleted, project.projectDetails.milestones_qty);

                    // Format category for URL
                    const formattedCategory = formatTitleForUrl(project.projectDetails.category);
                    // Format title for URL
                    const formattedTitle = formatTitleForUrl(project.projectDetails.title);

                    return (
                        <li
                            key={project.projectDetails.id}
                            className={`${styles.card} ${onRowClick ? styles.clickable : ''}`}
                            data-testid="proposal-item"
                            onClick={() => onRowClick && onRowClick(project.projectDetails.project_id)}
                        >
                            <div className={styles.cardInner}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.status} ${
                                        project.projectDetails.status === 'Completed' ? styles.statusCompleted :
                                        project.projectDetails.status === 'In Progress' ? styles.statusInProgress : 
                                        styles.statusPending
                                    }`}>
                                        {project.projectDetails.status}
                                    </span>
                                    <h3 className={styles.title}>{project.projectDetails.title}</h3>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoBox}>
                                            <span className={styles.infoLabel}>Fund</span>
                                            <span className={styles.infoValue}>{getFundingRound(project.projectDetails.category)}</span>
                                        </div>

                                        <div className={styles.infoBox}>
                                            <span className={styles.infoLabel}>Budget</span>
                                            <span className={styles.infoValue}>{formatAda(project.projectDetails.budget)}</span>
                                        </div>

                                        <div className={styles.infoBox}>
                                            <span className={styles.infoLabel}>Distributed</span>
                                            <span className={styles.infoValue}>{formatAda(project.projectDetails.funds_distributed)}</span>
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
                                                        background: progressPercent === 100 
                                                            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35))'
                                                            : progressPercent > 50
                                                            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.25))'
                                                            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.15))'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.projectIdBox}>
                                        <span className={styles.projectIdLabel}>Project ID</span>
                                        <span className={styles.projectIdValue}>{project.projectDetails.project_id}</span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <a
                                        href={`https://milestones.projectcatalyst.io/projects/${project.projectDetails.project_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.actionButton}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View Milestones
                                    </a>
                                    <a
                                        href={`https://projectcatalyst.io/funds/13/${formattedCategory}/${formattedTitle}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.actionButton}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View Details
                                    </a>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className={styles.timestamp}>
                Last updated: {formatDate(data.timestamp)}
            </div>
        </>
    );
};

export default CatalystProposalsList; 