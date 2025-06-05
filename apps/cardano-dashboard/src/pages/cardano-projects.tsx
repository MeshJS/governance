import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';

export default function CardanoProjects() {
    return (
        <div className={pageStyles.pageContainer}>
            <Head>
                <title>Cardano Projects | Cardano Dashboard</title>
            </Head>
            <main>
                <h1 className={pageStyles.pageTitle}>Cardano Projects</h1>
                <div className={pageStyles.section}>
                    <p>Coming soon</p>
                </div>
            </main>
        </div>
    );
} 