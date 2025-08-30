import React from 'react';
import styles from '../styles/shared/GlassMorphic.module.css';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  details?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, details }) => {
  return (
    <div className={`${styles.glassCard} ${styles.glassCardDark}`}>
      <div className={styles.errorContainer}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.errorIcon}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 className={styles.errorTitle}>{message}</h3>
        {details && <p className={styles.errorDetails}>{details}</p>}
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
