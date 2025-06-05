import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';

export default function Catalyst() {
    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Catalyst | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Catalyst</h1>
                <div className={pageStyles.section}>
                    <p>Coming soon</p>
                </div>
            </main>
        </div>
    );
} 