import { useData } from '../contexts/DataContext';
import styles from '../styles/Dashboard.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
    const { meshData, catalystData, drepVotingData, isLoading, error } = useData();

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Error: {error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.mainHeader}>
                <Image
                    src="/mesh-white-txt.png"
                    alt="Mesh Logo"
                    width={300}
                    height={100}
                    className={styles.meshLogo}
                    priority
                    style={{ width: 'auto', height: 'auto' }}
                />
            </header>

            <div className={styles.grid}>
                {/* Voting Activity Section */}
                <Link href="/drep-voting" className={`${styles.section} ${styles.votingActivity}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Mesh DRep</h2>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.previewImage}>
                            <Image
                                src="/previews/mesh-drep-preview.png"
                                alt="DRep Voting Preview"
                                width={600}
                                height={400}
                                className={styles.previewImage}
                                priority
                            />
                        </div>
                    </div>
                </Link>

                {/* Catalyst Proposals Overview */}
                <Link href="/catalyst-proposals" className={`${styles.section} ${styles.proposalsOverview}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Catalyst Proposals</h2>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.previewImage}>
                            <Image
                                src="/previews/catalyst-proposals-preview.png"
                                alt="Catalyst Proposals Preview"
                                width={600}
                                height={400}
                                className={styles.previewImage}
                                priority
                            />
                        </div>
                    </div>
                </Link>

                {/* Downloads Section */}
                <Link href="/mesh-stats" className={`${styles.section} ${styles.downloads} ${styles.compactCard}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Mesh Stats</h2>
                    </div>
                    <div className={`${styles.sectionContent} ${styles.centerContent}`}>
                        <div className={styles.previewImage}>
                            <Image
                                src="/previews/mesh-stats-preview.png"
                                alt="Mesh Stats Preview"
                                width={600}
                                height={400}
                                className={styles.previewImage}
                                priority
                            />
                        </div>
                    </div>
                </Link>

                {/* Projects Section */}
                <Link href="/projects" className={`${styles.section} ${styles.useCases}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Projects</h2>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.previewImage}>
                            <Image
                                src="/previews/projects-preview.png"
                                alt="Projects Preview"
                                width={600}
                                height={400}
                                className={styles.previewImage}
                                priority
                            />
                        </div>
                    </div>
                </Link>

                {/* Contributors Section */}
                <Link href="/contributors" className={`${styles.section} ${styles.contributors} ${styles.compactCard}`}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Contributors</h2>
                    </div>
                    <div className={`${styles.sectionContent} ${styles.centerContent}`}>
                        <div className={styles.previewImage}>
                            <Image
                                src="/previews/contributors-preview.png"
                                alt="Contributors Preview"
                                width={600}
                                height={400}
                                className={styles.previewImage}
                                priority
                            />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
} 