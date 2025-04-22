import type { AppProps } from 'next/app';
import { DataProvider } from '../contexts/DataContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider>
            <DataProvider>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </DataProvider>
        </ThemeProvider>
    );
} 