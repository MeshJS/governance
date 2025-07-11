import styles from '../styles/Home.module.css';

export default function Home() {
    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.title}>Welcome to the Dashboard</h1>
                <p className={styles.description}>This is the home page of your Next.js app.</p>
            </main>
            <footer className={styles.footer}>
                <p>API Machine - Dashboard</p>
            </footer>
        </div>
    );
}
