import { ReactNode } from 'react';
import styles from '../styles/ContributorCard.module.css';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`${styles.card} ${className}`}>
            {children}
        </div>
    );
} 