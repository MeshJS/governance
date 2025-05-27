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
                <main>
                    <h1>SPOs Activity</h1>
                    <div>
                        <SPOMap />
                    </div>
                </main>
            </div>
        </DataProvider>
    );
} 