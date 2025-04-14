import { ReactNode } from 'react';
import styles from '../styles/Dashboard.module.css';
import Link from 'next/link';

export type StatusIconType = 'blue' | 'green' | 'yellow' | 'red';

interface StatusCardProps {
    title: string;
    iconType: StatusIconType;
    subtitle: string;
    value?: string | number;
    href?: string;
    onClick?: () => void;
}

export default function StatusCard({
    title,
    iconType,
    subtitle,
    value,
    href,
    onClick
}: StatusCardProps) {
    // Map the icon type to the corresponding style
    const iconStyleMap: Record<StatusIconType, string> = {
        blue: styles.statusIconBlue,
        green: styles.statusIconGreen,
        yellow: styles.statusIconYellow,
        red: styles.statusIconRed
    };

    const cardContent = (
        <div className={styles.statusItemContent}>
            <div className={styles.statusItemTop}>
                <div className={styles.statusLabel}>
                    <div className={styles.statusTitle} title={title}>
                        {title}
                    </div>
                </div>
                <div className={`${styles.statusIcon} ${iconStyleMap[iconType]}`}></div>
            </div>

            {value && (
                <div className={styles.statusValue} title={String(value)}>
                    {value}
                </div>
            )}

            <div className={styles.statusItemBottom}>
                <div className={styles.statusSubtext} title={subtitle}>
                    {subtitle}
                </div>
            </div>
        </div>
    );

    // If href is provided, wrap the card in a Link
    if (href) {
        return (
            <Link href={href} className={`${styles.statusItem} ${styles.clickableCard}`} aria-label={`View details for ${title}`}>
                {cardContent}
            </Link>
        );
    }

    // If onClick is provided, make the card clickable
    if (onClick) {
        return (
            <div
                className={`${styles.statusItem} ${styles.clickableCard}`}
                onClick={onClick}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${title}`}
                onKeyDown={(e) => e.key === 'Enter' && onClick()}
            >
                {cardContent}
            </div>
        );
    }

    // If neither href nor onClick is provided, render a static card
    return (
        <div className={styles.statusItem}>
            {cardContent}
        </div>
    );
} 