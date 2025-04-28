import React from 'react';
import Navigation from './Navigation';
import styles from '../styles/Layout.module.css';
import Image from 'next/image';
import Link from 'next/link';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className={styles.container}>
            <div className={styles.sidebarContainer}>
                <Navigation />
                <Link 
                    href="https://cardano.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.cardanoLogo}
                >
                    <div className={styles.logoOrbit}></div>
                    <div className={styles.logoOrbitInner}></div>
                    <Image
                        src="/Cardano-RGB_Logo-Icon-White.png"
                        alt="Cardano Logo"
                        width={40}
                        height={40}
                        priority
                    />
                </Link>
            </div>
            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout; 