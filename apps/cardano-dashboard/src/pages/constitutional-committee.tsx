import Head from "next/head";
import { useDataContext } from "@/contexts/DataContext";
import { DataProvider } from "@/contexts/DataContext";
import pageStyles from '@/styles/PageLayout.module.css';
import PageLoading from "@/components/PageLoading";
import VotingChart from "@/components/VotingChart";
import CommitteeMemberVoteChart from "@/components/CommitteeMemberVoteChart";

function ConstitutionalCommitteeContent() {
    const { committeeData, governanceProposals, loading } = useDataContext();

    // Show loading state when data is loading
    if (loading.committeeData || loading.governanceProposals) {
        return (
            <>
                <Head>
                    <title>Constitutional Committee | Cardano Dashboard</title>
                </Head>
                <PageLoading title="Constitutional Committee" message="Loading committee and governance data..." />
            </>
        );
    }

    // Show error state when data is not available
    if (!committeeData || !governanceProposals) {
        return (
            <div className={pageStyles.pageContainer}>
                <Head>
                    <title>Constitutional Committee | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={pageStyles.pageTitle}>Constitutional Committee</h1>
                    <div className={pageStyles.emptyState}>
                        No committee or governance data available
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Constitutional Committee | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Constitutional Committee</h1>
                <div className={pageStyles.section}>
                    {committeeData.length > 0 ? (
                        <div className={pageStyles.chartsContainer}>
                            <div className={pageStyles.chartSection}>
                                <CommitteeMemberVoteChart committeeData={committeeData} />
                            </div>
                            <div className={pageStyles.chartSection}>
                                <VotingChart type="committee" proposals={governanceProposals} />
                            </div>
                        </div>
                    ) : (
                        <div className={pageStyles.emptyState}>No committee data available</div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ConstitutionalCommittee() {
    return (
        <DataProvider fetchOptions={{ fetchCommitteeData: true, fetchGovernanceProposals: true }}>
            <ConstitutionalCommitteeContent />
        </DataProvider>
    );
} 