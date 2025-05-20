import Head from "next/head";
import NetworkTotalsChart from "@/components/NetworkTotalsChart";
import { useDataContext } from "@/contexts/DataContext";

export default function Treasury() {
    const { networkTotals, loading, error, isError } = useDataContext();

    return (
        <div>
            <Head>
                <title>Treasury | Cardano Dashboard</title>
            </Head>
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Treasury Activity</h1>

                {loading.networkTotals ? (
                    <div className="w-full p-4 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/8 shadow-lg">
                        <h3 className="text-xl text-white mb-6">Network Totals</h3>
                        <div className="w-full h-[400px] flex items-center justify-center">
                            <div className="text-white/60">Loading chart...</div>
                        </div>
                    </div>
                ) : isError.networkTotals ? (
                    <div className="w-full p-4 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl rounded-2xl border border-white/8 shadow-lg">
                        <h3 className="text-xl text-white mb-6">Network Totals</h3>
                        <div className="w-full h-[400px] flex items-center justify-center">
                            <div className="text-red-500">Error: {error.networkTotals?.message || 'Failed to load network totals'}</div>
                        </div>
                    </div>
                ) : (
                    <NetworkTotalsChart data={networkTotals} />
                )}
            </main>
        </div>
    );
} 