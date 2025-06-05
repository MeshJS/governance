import Head from "next/head";
import { useDataContext } from "@/contexts/DataContext";
import DRepVotingChart from "@/components/DRepVotingChart";
import DRepTable from "@/components/DRepTable";
import { DataProvider } from "@/contexts/DataContext";
import pageStyles from "@/styles/PageLayout.module.css";
import PageLoading from "@/components/PageLoading";

function DRepActivityContent() {
    const { governanceProposals, drepData, loading } = useDataContext();

    // Show loading state when any data is loading
    if (loading.governanceProposals || loading.drepData) {
        return (
            <>
                <Head>
                    <title>DRep Activity | Cardano Dashboard</title>
                </Head>
                <PageLoading title="DRep Activity" message="Loading DRep data..." />
            </>
        );
    }

    // Show error state when data is not available
    if (!governanceProposals || !drepData) {
        return (
            <div className={pageStyles.pageContainer}>
                <Head>
                    <title>DRep Activity | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={pageStyles.pageTitle}>DRep Activity</h1>
                    <div className={pageStyles.emptyState}>
                        No DRep data available
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>DRep Activity | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>DRep Activity</h1>
                <div className={pageStyles.section}>
                    {governanceProposals.length > 0 ? (
                        <DRepVotingChart proposals={governanceProposals} />
                    ) : (
                        <div className={pageStyles.emptyState}>No DRep voting data available</div>
                    )}
                </div>

                <h2 className={pageStyles.pageSubtitle}>DRep Directory</h2>
                <div className={pageStyles.section}>
                    {drepData.length > 0 ? (
                        <DRepTable drepData={drepData} />
                    ) : (
                        <div className={pageStyles.emptyState}>No DRep data available</div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function DRepActivity() {
    return (
        <DataProvider fetchOptions={{ fetchDRepData: true, fetchGovernanceProposals: true }}>
            <DRepActivityContent />
        </DataProvider>
    );
} 