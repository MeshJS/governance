import React, { ReactNode } from 'react';
import styles from '../styles/PageHeader.module.css';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: string;
    actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    actions
}) => {
    return (
        <div className={styles.headerContainer}>
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <div>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
            </div>
        </div>
    );
};

export default PageHeader; 