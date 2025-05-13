import { FaTimes } from 'react-icons/fa';
import styles from './HelpModal.module.css';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const sections = [
    { name: 'Treasury Section', status: 'active' },
    { name: 'SPOs Activity', status: 'coming-soon' },
    { name: 'DRep Activity', status: 'coming-soon' },
    { name: 'Constitutional Committee', status: 'coming-soon' },
    { name: 'Cardano Projects', status: 'coming-soon' },
    { name: 'GitHub Activity', status: 'coming-soon' },
    { name: 'npmjs Activity', status: 'coming-soon' },
    { name: 'CIP Activity', status: 'coming-soon' },
    { name: 'Catalyst Section', status: 'coming-soon' },
    { name: 'Profile Pages', status: 'coming-soon' },
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <FaTimes />
                </button>

                <h2 className={styles.title}>Help & Support</h2>

                <div className={styles.content}>
                    <h3 className={styles.sectionTitle}>Available Sections</h3>
                    <ul className={styles.sectionsList}>
                        {sections.map((section, index) => (
                            <li key={index} className={styles.sectionItem}>
                                <span className={styles.sectionName}>{section.name}</span>
                                {section.status === 'coming-soon' && (
                                    <span className={styles.comingSoon}>Coming Soon</span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className={styles.support}>
                        <h3 className={styles.sectionTitle}>Need Help?</h3>
                        <a
                            href="https://github.com/MeshJS/governance/issues/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.issueLink}
                        >
                            Submit an Issue
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
} 