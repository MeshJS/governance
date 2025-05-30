// ../pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { DataProvider } from "@/contexts/DataContext";
import 'leaflet/dist/leaflet.css';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Set up cache persistence
if (typeof window !== 'undefined') {
    const persister = createSyncStoragePersister({
        storage: window.localStorage,
    });

    persistQueryClient({
        queryClient,
        persister,
        maxAge: 30 * 60 * 1000, // 30 minutes
    });
}

function App({ Component, pageProps }: AppProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <DataProvider fetchOptions={{ fetchChainTip: true }}>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </DataProvider>
        </QueryClientProvider>
    );
}

export default App;