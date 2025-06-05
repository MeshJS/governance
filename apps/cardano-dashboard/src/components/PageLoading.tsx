import React from 'react';
import pageStyles from '@/styles/PageLayout.module.css';
import styles from '../styles/PageLoading.module.css';

interface PageLoadingProps {
    title: string;
    message?: string;
}

export default function PageLoading({ title, message = 'Loading...' }: PageLoadingProps) {
    return (
        <div className={pageStyles.pageContainer}>
            <main>
                <h1 className={pageStyles.pageTitle}>{title}</h1>
                <div className={pageStyles.loadingState}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingDots}>
                            <div className={styles.dot}></div>
                            <div className={styles.dot}></div>
                            <div className={styles.dot}></div>
                        </div>
                        <div className={styles.message}>{message}</div>
                    </div>
                </div>
            </main>
        </div>
    );
} 