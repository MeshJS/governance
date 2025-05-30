import Head from "next/head";
import { useDataContext } from "@/contexts/DataContext";
import DRepVotingChart from "@/components/DRepVotingChart";
import DRepTable from "@/components/DRepTable";
import { DataProvider } from "@/contexts/DataContext";

function DRepActivityContent() {
    const { governanceProposals, drepData, loading } = useDataContext();

    return (
        <div>
            <Head>
                <title>DRep Activity | Cardano Dashboard</title>
            </Head>
            <main>
                <h1>DRep Activity</h1>
                {loading.governanceProposals ? (
                    <p>Loading DRep voting data...</p>
                ) : governanceProposals && governanceProposals.length > 0 ? (
                    <DRepVotingChart proposals={governanceProposals} />
                ) : (
                    <p>No DRep voting data available</p>
                )}

                <h2>DRep Directory</h2>
                {loading.drepData ? (
                    <p>Loading DRep data...</p>
                ) : drepData && drepData.length > 0 ? (
                    <DRepTable drepData={drepData} />
                ) : (
                    <p>No DRep data available</p>
                )}
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