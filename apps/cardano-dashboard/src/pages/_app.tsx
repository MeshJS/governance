// ../pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { DataProvider } from "@/contexts/DataContext";
import { WalletProvider } from "@/contexts/WalletContext";
import 'leaflet/dist/leaflet.css';
import { MeshProvider } from "@meshsdk/react";

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
    const persister = createAsyncStoragePersister({
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
        <MeshProvider>
            <QueryClientProvider client={queryClient}>
                <WalletProvider>
                    <DataProvider fetchOptions={{ fetchChainTip: true }}>
                        <Layout>
                            <Component {...pageProps} />
                        </Layout>
                    </DataProvider>
                </WalletProvider>
            </QueryClientProvider>
        </MeshProvider>
    );
}

export default App;