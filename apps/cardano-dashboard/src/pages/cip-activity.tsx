import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';

export default function CIPActivity() {
    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>CIP Activity | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>CIP Activity</h1>
                <div className={pageStyles.section}>
                    <p>Coming soon</p>
                </div>
            </main>
        </div>
    );
} 