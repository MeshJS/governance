import type { AppProps } from 'next/app';
import { DataProvider } from '../contexts/DataContext';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';

// Disable Next.js scroll restoration
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual';
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DataProvider>
      <Layout>
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </Layout>
    </DataProvider>
  );
}
