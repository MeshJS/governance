import Head from "next/head";
import dynamic from 'next/dynamic';
import { DataProvider } from "../contexts/DataContext";
import { useDataContext } from "../contexts/DataContext";
import SPOStats from "../components/SPOStats";
import SPOVotingChart from "../components/SPOVotingChart";
import SPOTable from "../components/SPOTable";
import styles from '../styles/SPOsActivity.module.css';

// Dynamically import the SPOMap component with SSR disabled
const SPOMap = dynamic(() => import('../components/SPOMap').then(mod => mod.SPOMap), {
    ssr: false,
    loading: () => <div className={styles.loadingContainer}>Loading map...</div>
});

function SPOsActivityContent() {
    const { spoData, governanceProposals, loading } = useDataContext();

    // Show loading state when data is loading
    if (loading.spoData || loading.governanceProposals) {
        return (
            <div className={styles.container}>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={styles.title}>SPOs Activity</h1>
                    <SPOStats spoData={[]} />
                    <div className={styles.gridContainer}>
                        <div className={styles.loadingContainer}>Loading...</div>
                        <div className={styles.loadingContainer}>Loading...</div>
                    </div>
                    <div className={styles.loadingContainer}>Loading SPO table...</div>
                </main>
            </div>
        );
    }

    // Show error state when data is not available
    if (!spoData || !governanceProposals) {
        return (
            <div className={styles.container}>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1 className={styles.title}>SPOs Activity</h1>
                    <SPOStats spoData={[]} />
                    <div className={styles.gridContainer}>
                        <div className={styles.errorContainer}>No data available</div>
                        <div className={styles.errorContainer}>No data available</div>
                    </div>
                    <div className={styles.errorContainer}>No SPO data available</div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>SPOs Activity | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={styles.title}>SPOs Activity</h1>
                <SPOStats spoData={spoData} />
                <div className={styles.gridContainer}>
                    <div className={styles.gridItem}>
                        <SPOMap />
                    </div>
                    <div className={styles.gridItem}>
                        <SPOVotingChart proposals={governanceProposals} />
                    </div>
                </div>
                <div className={styles.tableSection}>
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