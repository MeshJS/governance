import Head from "next/head";
import dynamic from 'next/dynamic';
import { DataProvider } from "../contexts/DataContext";

// Dynamically import the SPOMap component with SSR disabled
const SPOMap = dynamic(() => import('../components/SPOMap').then(mod => mod.SPOMap), {
    ssr: false,
    loading: () => <div>Loading map...</div>
});

export default function SPOsActivity() {
    return (
        <DataProvider>
            <div>
                <Head>
                    <title>SPOs Activity | Cardano Dashboard</title>
                </Head>
                <main className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6">SPOs Activity</h1>
                    <div className="bg-white rounded-lg shadow-lg p-4" style={{ minHeight: '600px' }}>
                        <SPOMap />
                    </div>
                </main>
            </div>
        </DataProvider>
    );
} 