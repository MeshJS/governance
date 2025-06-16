import styles from './MilestoneProgressBars.module.css';

interface Props {
    milestones: {
        number: number;
        budget: string;
        delivered: string;
        isCloseOut?: boolean;
    }[];
    completedCount: number;
    projectTitle: string;
    fundingRound: string;
    totalMilestones: number;
}

export function MilestoneProgressBars({ milestones, completedCount, projectTitle, fundingRound, totalMilestones }: Props) {
    // Create an array of all milestone numbers
    const allMilestoneNumbers = Array.from({ length: totalMilestones }, (_, i) => i + 1);

    // Map existing milestone data to their numbers
    const milestoneMap = new Map(milestones.map(m => [m.number, m]));

    // Sort milestones by number, putting close-out report at the end
    const closeOutReport = milestones.find(m => m.isCloseOut);

    return (
        <div className={styles.milestoneOverview}>
            <h3 className={styles.milestoneOverviewTitle}>Project Milestones Progress</h3>
            <div className={styles.milestoneGrid}>
                <div className={styles.milestoneRow}>
                    <div className={styles.milestoneHeader}>
                        <div className={styles.milestoneTitle}>
                            <span className={styles.fundTag}>{fundingRound}</span>
                            <span className={styles.projectTitle}>{projectTitle}</span>
                        </div>
                        <div className={styles.milestoneCount}>
                            {completedCount}/{totalMilestones}
                        </div>
                    </div>
                    <div className={styles.milestoneBars}>
                        {/* Regular milestones */}
                        {allMilestoneNumbers.map((number) => {
                            const milestone = milestoneMap.get(number);
                            const isCompleted = number <= completedCount;
                            return (
                                <div 
                                    key={number} 
                                    className={`${styles.milestoneBarItem} ${isCompleted ? styles.completed : ''}`}
                                >
                                    <div className={styles.milestoneBarHeader}>
                                        <span className={styles.milestoneBarTitle}>
                                            Milestone {number}
                                            {milestone?.budget && (
                                                <span className={styles.milestoneBarBudget}>
                                                    {milestone.budget}
                                                </span>
                                            )}
                                        </span>
                                        {milestone?.delivered && (
                                            <span className={styles.milestoneBarDelivered}>
                                                Delivered: {milestone.delivered}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.milestoneProgressBar}>
                                        <div
                                            className={styles.milestoneProgressFill}
                                            style={{
                                                width: isCompleted ? '100%' : '0%',
                                                background: isCompleted
                                                    ? 'linear-gradient(90deg, rgba(56, 232, 225, 0.25), rgba(56, 232, 225, 0.35))'
                                                    : 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {/* Close-out report if exists */}
                        {closeOutReport && (
                            <div 
                                key="close-out" 
                                className={`${styles.milestoneBarItem} ${styles.closeOut} ${completedCount >= totalMilestones ? styles.completed : ''}`}
                            >
                                <div className={styles.milestoneBarHeader}>
                                    <span className={styles.milestoneBarTitle}>
                                        Close-out Report
                                        <span className={styles.milestoneBarBudget}>
                                            {closeOutReport.budget}
                                        </span>
                                    </span>
                                    <span className={styles.milestoneBarDelivered}>
                                        Delivered: {closeOutReport.delivered}
                                    </span>
                                </div>
                                <div className={styles.milestoneProgressBar}>
                                    <div
                                        className={styles.milestoneProgressFill}
                                        style={{
                                            width: completedCount >= totalMilestones ? '100%' : '0%',
                                            background: completedCount >= totalMilestones
                                                ? 'linear-gradient(90deg, rgba(56, 232, 225, 0.25), rgba(56, 232, 225, 0.35))'
                                                : 'transparent'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 