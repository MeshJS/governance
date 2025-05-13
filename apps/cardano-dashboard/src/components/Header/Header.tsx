import { useState } from 'react';
import Head from 'next/head';
import { FaUser, FaQuestionCircle } from 'react-icons/fa';
import styles from '../../styles/Header.module.css';
import HelpModal from '../HelpModal/HelpModal';

interface HeaderProps {
    title?: string;
}

export default function Header({ title = 'Cardano Dashboard' }: HeaderProps) {
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>
            <header className={styles.header}>
                <div className={styles.logo}>Cardano Dashboard</div>

                <div className={styles.center}>
                    <h1 className={styles.title}>{title}</h1>
                </div>

                <div className={styles.right}>
                    <button className={styles.walletButton}>
                        Connect Wallet
                    </button>

                    <div className={styles.userMenu}>
                        <button
                            className={styles.userButton}
                            onClick={() => setIsHelpModalOpen(true)}
                        >
                            <FaQuestionCircle />
                        </button>
                    </div>
                </div>

                <HelpModal
                    isOpen={isHelpModalOpen}
                    onClose={() => setIsHelpModalOpen(false)}
                />
            </header>
        </>
    );
} 