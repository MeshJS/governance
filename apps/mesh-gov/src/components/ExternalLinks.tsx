import styles from './ExternalLinks.module.css';

interface Props {
    projectLink: string;
    milestonesLink: string;
}

export function ExternalLinks({ projectLink, milestonesLink }: Props) {
    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>External Links</h2>
            <div className={styles.links}>
                <a 
                    href={projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    View full Proposal on Catalyst Website →
                </a>
                <a 
                    href={milestonesLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    View Milestones on Catalyst Platform →
                </a>
            </div>
        </div>
    );
} 