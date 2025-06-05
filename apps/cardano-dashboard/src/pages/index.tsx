import Head from "next/head";
import pageStyles from '@/styles/PageLayout.module.css';

export default function Home() {
  return (
    <div className={pageStyles.pageContainer}>
      <Head>
        <title>Cardano Dashboard</title>
        <meta name="description" content="A Cardano dApp powered by Mesh" />
      </Head>
      <main>
        <h1 className={pageStyles.pageTitle}>
          Cardano Dashboard
        </h1>
        <div className={pageStyles.section}>
          <p>Welcome to the Home page!</p>
        </div>
      </main>
      <footer>
        Footer
      </footer>
    </div>
  );
}
