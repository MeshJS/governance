import Head from "next/head";
import { useDataContext } from "@/contexts/DataContext";
import DRepVotingChart from "@/components/DRepVotingChart";

export default function DRepActivity() {
    const { governanceProposals, loading } = useDataContext();

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
            </main>
        </div>
    );
} 