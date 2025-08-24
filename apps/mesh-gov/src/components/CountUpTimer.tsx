import { useEffect, useState } from 'react';
import styles from './CountUpTimer.module.css';

interface TimeUnits {
    years: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface CountUpTimerProps {
    startDate: Date;
    title: string;
}

function calculateTimeDifference(startDate: Date): TimeUnits {
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();

    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) % 365;
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));

    return { years, days, hours, minutes, seconds };
}

export function CountUpTimer({ startDate, title }: CountUpTimerProps) {
    const [time, setTime] = useState<TimeUnits>(calculateTimeDifference(startDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(calculateTimeDifference(startDate));
        }, 1000);

        return () => clearInterval(timer);
    }, [startDate]);

    return (
        <div className={styles.timerContainer}>
            <h3 className={styles.timerTitle}>{title}</h3>
            <div className={styles.timerUnits}>
                <div className={styles.unit}>
                    <span className={styles.value}>{time.years}</span>
                    <span className={styles.label}>years</span>
                </div>
                <div className={styles.unit}>
                    <span className={styles.value}>{time.days}</span>
                    <span className={styles.label}>days</span>
                </div>
                <div className={styles.unit}>
                    <span className={styles.value}>{time.hours}</span>
                    <span className={styles.label}>hours</span>
                </div>
                <div className={styles.unit}>
                    <span className={styles.value}>{time.minutes}</span>
                    <span className={styles.label}>minutes</span>
                </div>
                <div className={styles.unit}>
                    <span className={styles.value}>{time.seconds}</span>
                    <span className={styles.label}>seconds</span>
                </div>
            </div>
        </div>
    );
} 