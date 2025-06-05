import Head from "next/head";
import dynamic from 'next/dynamic';
import { DataProvider } from "../contexts/DataContext";
import { useDataContext } from "../contexts/DataContext";
import SPOStats from "../components/SPOStats";
import SPOVotingChart from "../components/SPOVotingChart";
import SPOTable from "../components/SPOTable";
import pageStyles from '@/styles/PageLayout.module.css';
import PageLoading from "@/components/PageLoading";

// Dynamically import the SPOMap component with SSR disabled
const SPOMap = dynamic(() => import('../components/SPOMap').then(mod => mod.SPOMap), {
    ssr: false,
    loading: () => null
});

function SPOsActivityContent() {
    const { spoData, governanceProposals, loading } = useDataContext();

    // Show loading state when any data is loading
    if (loading.spoData || loading.governanceProposals) {
        return (
            <>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <PageLoading title="SPOs Activity" message="Loading SPO data..." />
            </>
        );
    }

    // Show error state when data is not available
    if (!spoData || !governanceProposals) {
        return (
            <div className={pageStyles.pageContainer}>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={pageStyles.pageTitle}>SPOs Activity</h1>
                    <div className={pageStyles.emptyState}>
                        No SPO data available
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>SPOs Activity | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>SPOs Activity</h1>
                <div className={pageStyles.section}>
                    <SPOStats spoData={spoData} />
                </div>
                <div className={pageStyles.gridContainer}>
                    <div className={pageStyles.section}>
                        <SPOMap />
                    </div>
                    <div className={pageStyles.section}>
                        <SPOVotingChart proposals={governanceProposals} />
                    </div>
                </div>
                <div className={pageStyles.section}>
                    <SPOTable spoData={spoData} />
                </div>
            </main>
        </div>
    );
}

export default function SPOsActivity() {
    return (
        <DataProvider fetchOptions={{ fetchSPOData: true, fetchGovernanceProposals: true }}>
            <SPOsActivityContent />
        </DataProvider>
    );
} 