import type { AppProps } from 'next/app';
import { DataProvider } from '../contexts/DataContext';
import Layout from '../components/Layout';
import '../styles/globals.css';
import Router from 'next/router';

// Disable Next.js scroll restoration
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DataProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </DataProvider>
  );
}
