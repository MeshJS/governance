import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';

export default function ConstitutionalCommittee() {
    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Constitutional Committee | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Constitutional Committee</h1>
                <div className={pageStyles.section}>
                    <p>Coming soon</p>
                </div>
            </main>
        </div>
    );
} 