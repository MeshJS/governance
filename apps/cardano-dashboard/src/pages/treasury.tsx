import Head from "next/head";
import dynamic from 'next/dynamic';
import NetworkTotalsChart from "@/components/NetworkTotalsChart";
import { useDataContext } from "@/contexts/DataContext";
import styles from "@/styles/Treasury.module.css";
import { useEffect, useState } from "react";

// Dynamically import client-side only components
const ProposalTypeChart = dynamic(() => import("@/components/ProposalTypeChart"), {
    ssr: false,
    loading: () => (
        <div className={styles.chartStatusContainer}>
            <div className={styles.loadingText}>Loading chart...</div>
        </div>
    )
});

const ProposalVotingCards = dynamic(() => import("@/components/ProposalVotingCards"), {
    ssr: false,
    loading: () => (
        <div className={styles.chartStatusContainer}>
            <div className={styles.loadingText}>Loading cards...</div>
        </div>
    )
});

export default function Treasury() {
    const { networkTotals, governanceProposals, loading, error, isError } = useDataContext();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const renderNetworkTotals = () => {
        if (!isMounted || loading.networkTotals) {
            return (
                <div className={styles.chartStatusContainer}>
                    <div className={styles.loadingText}>Loading chart...</div>
                </div>
            );
        }

        if (isError.networkTotals) {
            return (
                <div className={styles.chartStatusContainer}>
                    <div className={styles.errorText}>Error: {error.networkTotals?.message || 'Failed to load network totals'}</div>
                </div>
            );
        }

        return <NetworkTotalsChart data={networkTotals} />;
    };

    const renderGovernanceProposals = () => {
        if (!isMounted || loading.governanceProposals) {
            return (
                <div className={styles.chartStatusContainer}>
                    <div className={styles.loadingText}>Loading proposals...</div>
                </div>
            );
        }

        if (isError.governanceProposals) {
            return (
                <div className={styles.chartStatusContainer}>
                    <div className={styles.errorText}>Error: {error.governanceProposals?.message || 'Failed to load governance proposals'}</div>
                </div>
            );
        }

        if (!governanceProposals) {
            return null;
        }

        return (
            <div className={styles.governanceContent}>
                <div className={styles.proposalTypeChart}>
                    <ProposalTypeChart proposals={governanceProposals} />
                </div>
                <div className={styles.proposalVotingCards}>
                    <ProposalVotingCards proposals={governanceProposals} />
                </div>
            </div>
        );
    };

    return (
        <div>
            <Head>
                <title>Treasury | Cardano Dashboard</title>
            </Head>
            <main className={styles.container}>
                <h1 className={styles.title}>Treasury Activity</h1>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Network Totals</h3>
                    {renderNetworkTotals()}
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Governance Proposals</h3>
                    {renderGovernanceProposals()}
                </section>
            </main>
        </div>
    );
} 