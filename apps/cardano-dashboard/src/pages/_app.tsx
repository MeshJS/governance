// ../pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { DataProvider } from "@/contexts/DataContext";

function App({ Component, pageProps }: AppProps) {
    return (
        <DataProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </DataProvider>
    );
}

export default App;