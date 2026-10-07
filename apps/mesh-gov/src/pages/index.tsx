import styles from '../styles/Dashboard.module.css';
import Image from 'next/image';
import { CountUpTimer } from '../components/CountUpTimer';

export default function Dashboard() {
  return (
    <>
      <header className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoBox}>
            <Image
              src="/mesh-white-txt.png"
              alt="Mesh Logo"
              width={300}
              height={100}
              className={styles.meshLogo}
              priority
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          <div className={styles.timerBox}>
            <CountUpTimer startDate={new Date('2021-01-01')} title="Building on Cardano Since" />
          </div>
        </div>
      </header>
    </>
  );
}
