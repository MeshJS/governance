import React from 'react';
import styles from '../styles/shared/GlassMorphic.module.css';

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
    message = 'Loading...', 
    size = 'medium' 
}) => {
    return (
        <div className={`${styles.glassCard} ${styles.glassCardCompact}`}>
            <div className={styles.loadingContainer}>
                <div className={`${styles.loadingSpinner} ${styles[size]}`} />
                <p className={styles.loadingText}>{message}</p>
            </div>
        </div>
    );
};

export default LoadingState; 