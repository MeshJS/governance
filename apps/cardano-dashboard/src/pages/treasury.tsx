import Head from "next/head";
import NetworkTotalsChart from "@/components/NetworkTotalsChart";
import { useDataContext } from "@/contexts/DataContext";
import styles from "@/styles/Treasury.module.css";
import { useEffect, useState } from "react";

export default function Treasury() {
    const { networkTotals, loading, error, isError } = useDataContext();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div>
            <Head>
                <title>Treasury | Cardano Dashboard</title>
            </Head>
            <main className={styles.container}>
                <h1 className={styles.title}>Treasury Activity</h1>

                {!isMounted ? (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Network Totals</h3>
                        <div className={styles.chartStatusContainer}>
                            <div className={styles.loadingText}>Loading chart...</div>
                        </div>
                    </section>
                ) : loading.networkTotals ? (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Network Totals</h3>
                        <div className={styles.chartStatusContainer}>
                            <div className={styles.loadingText}>Loading chart...</div>
                        </div>
                    </section>
                ) : isError.networkTotals ? (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Network Totals</h3>
                        <div className={styles.chartStatusContainer}>
                            <div className={styles.errorText}>Error: {error.networkTotals?.message || 'Failed to load network totals'}</div>
                        </div>
                    </section>
                ) : (
                    <section className={styles.section}>
                        <NetworkTotalsChart data={networkTotals} />
                    </section>
                )}
            </main>
        </div>
    );
} 