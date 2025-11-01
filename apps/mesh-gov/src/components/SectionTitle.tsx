import React, { ReactNode } from 'react';
import styles from '../styles/SectionTitle.module.css';

interface SectionTitleProps {
  title: ReactNode;
  subtitle?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle }) => {
  return (
    <div className={styles.sectionTitleContainer}>
      <div className={styles.sectionTitleContent}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
};

export default SectionTitle;

