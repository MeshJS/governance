import Head from "next/head";
import dynamic from 'next/dynamic';
import NetworkTotalsChart from "@/components/NetworkTotalsChart";
import { useDataContext } from "@/contexts/DataContext";
import { DataProvider } from "@/contexts/DataContext";
import pageStyles from "@/styles/PageLayout.module.css";
import PageLoading from "@/components/PageLoading";
import { useEffect, useState } from "react";
import type { ProposalVotingCardsProps } from "@/components/ProposalVotingCards";

// Dynamically import client-side only components
const ProposalTimelineChart = dynamic(() => import("@/components/ProposalTimelineChart"), {
    ssr: false,
    loading: () => null
});

const ProposalTypeChart = dynamic(() => import("@/components/ProposalTypeChart"), {
    ssr: false,
    loading: () => null
});

const ProposalOutcomeChart = dynamic(() => import("@/components/ProposalOutcomeChart"), {
    ssr: false,
    loading: () => null
});

const ProposalVotingCards = dynamic(() => import("@/components/ProposalVotingCards"), {
    ssr: false,
    loading: () => null
});

function TreasuryContent() {
    const { networkTotals, governanceProposals, loading, error, isError } = useDataContext();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Show loading state when any data is loading
    if (!isMounted || loading.networkTotals || loading.governanceProposals) {
        return (
            <>
                <Head>
                    <title>Treasury | Cardano Dashboard</title>
                </Head>
                <PageLoading title="Treasury Activity" message="Loading treasury data..." />
            </>
        );
    }

    // Show error state if any data failed to load
    if (isError.networkTotals || isError.governanceProposals) {
        return (
            <div className={pageStyles.pageContainer}>
                <Head>
                    <title>Treasury | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={pageStyles.pageTitle}>Treasury Activity</h1>
                    <div className={pageStyles.emptyState}>
                        Error: {error.networkTotals?.message || error.governanceProposals?.message || 'Failed to load treasury data'}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Treasury | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Treasury Activity</h1>
                    <div className={pageStyles.section}>
                        <NetworkTotalsChart data={networkTotals} />
                    </div>
                    <div className={pageStyles.section}>
                        <ProposalTimelineChart proposals={governanceProposals} />
                    </div>
                    <div className={pageStyles.gridContainer}>
                        <div className={pageStyles.section}>
                            <ProposalTypeChart proposals={governanceProposals} />
                        </div>
                        <div className={pageStyles.section}>
                            <ProposalOutcomeChart proposals={governanceProposals} />
                        </div>
                    </div>
                    <div className={pageStyles.section}>
                        <ProposalVotingCards proposals={governanceProposals.filter(p => p.expiration !== null) as ProposalVotingCardsProps['proposals']} />
                    </div>
            </main>
        </div>
    );
}

export default function Treasury() {
    return (
        <DataProvider fetchOptions={{
            fetchNetworkTotals: true,
            fetchGovernanceProposals: true
        }}>
            <TreasuryContent />
        </DataProvider>
    );
} 