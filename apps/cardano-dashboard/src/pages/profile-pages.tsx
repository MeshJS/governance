import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';

export default function ProfilePages() {
    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Profile Pages | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Profile Pages</h1>
                <div className={pageStyles.section}>
                    <p>Coming soon</p>
                </div>
            </main>
        </div>
    );
} 