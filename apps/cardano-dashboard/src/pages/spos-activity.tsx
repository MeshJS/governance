import Head from "next/head";
import dynamic from 'next/dynamic';
import { DataProvider } from "../contexts/DataContext";
import { useDataContext } from "../contexts/DataContext";
import SPOStats from "../components/SPOStats";
import SPOVotingChart from "../components/SPOVotingChart";

// Dynamically import the SPOMap component with SSR disabled
const SPOMap = dynamic(() => import('../components/SPOMap').then(mod => mod.SPOMap), {
    ssr: false,
    loading: () => <div>Loading map...</div>
});

function SPOsActivityContent() {
    const { spoData, governanceProposals, loading } = useDataContext();

    // Show loading state when data is loading
    if (loading.spoData || loading.governanceProposals) {
        return (
            <div>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1>SPOs Activity</h1>
                    <SPOStats spoData={[]} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>Loading...</div>
                        <div>Loading...</div>
                    </div>
                </main>
            </div>
        );
    }

    // Show error state when data is not available
    if (!spoData || !governanceProposals) {
        return (
            <div>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <main>
                    <h1>SPOs Activity</h1>
                    <SPOStats spoData={[]} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>No data available</div>
                        <div>No data available</div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div>
            <Head>
                <title>SPOs Activity | Cardano Dashboard</title>
            </Head>
            <main>
                <h1>SPOs Activity</h1>
                <SPOStats spoData={spoData} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <SPOVotingChart proposals={governanceProposals} />
                    </div>
                    <div>
                        <SPOMap />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function SPOsActivity() {
    return (
        <DataProvider>
            <SPOsActivityContent />
        </DataProvider>
    );
} 