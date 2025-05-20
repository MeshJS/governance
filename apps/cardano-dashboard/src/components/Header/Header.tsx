import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FaQuestionCircle } from 'react-icons/fa';
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
                <Link href="/" className={styles.logo}>
                    Cardano Dashboard
                </Link>

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