import React from 'react';
import Navigation from './Navigation';
import styles from '../styles/Layout.module.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className={styles.container}>
            <div className={styles.sidebarContainer}>
                <Navigation />
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