import Head from "next/head";
import { useDataContext } from "@/contexts/DataContext";
import DRepVotingChart from "@/components/DRepVotingChart";
import DRepTable from "@/components/DRepTable";
import DRepDelegationTreemap from "@/components/DRepDelegationTreemap";
import { DataProvider } from "@/contexts/DataContext";
import pageStyles from "@/styles/PageLayout.module.css";
import PageLoading from "@/components/PageLoading";
import { DRepDetailedData } from "../../types/drep";
import DRepStats from "@/components/DRepStats";

// Type adapter to convert DRepDetailedData to the format expected by DRepDelegationTreemap
const adaptDRepData = (drepData: DRepDetailedData[]) => {
    return drepData.map(drep => {
        const rawGivenName = drep.meta_json?.body?.givenName as unknown;
        const givenName = typeof rawGivenName === 'string'
            ? rawGivenName
            : (typeof rawGivenName === 'object' && rawGivenName !== null && '@value' in (rawGivenName as Record<string, unknown>)
                ? (rawGivenName as Record<string, unknown>)['@value'] as string
                : undefined);

        return {
            drep_id: drep.drep_id,
            total_delegated_amount: parseFloat(drep.amount),
            total_delegators: drep.total_delegators,
            meta_json: givenName ? { body: { givenName } } : null,
        };
    });
};

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
                    <DRepStats drepData={drepData} />
                </div>
                <div className={pageStyles.chartsContainer}>
                    <div className={pageStyles.chartSection}>
                        <DRepDelegationTreemap drepData={adaptDRepData(drepData)} />
                    </div>
                    <div className={pageStyles.chartSection}>
                        {governanceProposals.length > 0 ? (
                            <DRepVotingChart proposals={governanceProposals} />
                        ) : (
                            <div className={pageStyles.emptyState}>No DRep voting data available</div>
                        )}
                    </div>
                </div>

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