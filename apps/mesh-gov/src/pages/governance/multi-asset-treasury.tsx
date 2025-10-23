import styles from '../../styles/Governance.module.css';
import PageHeader from '../../components/PageHeader';

export default function MultiAssetTreasury() {
  return (
    <div className={styles.container}>
      <PageHeader
        title="Cardano Multi Asset Treasury"
        subtitle="The ideation, design and development of a Cardano Multi Asset Treasury"
      />
      
      <div className={styles.initiativeTag}>
        A cardano community initiative by SIDAN Lab &amp; Mesh
      </div>
      
      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Objectives</h2>
          <p className={styles.sectionText}>
            Cardano&apos;s on-chain treasury (part of the Voltaire governance era) currently holds funds in ADA only. 
            However, there is growing interest in allowing the treasury to support multiple assets. 
            This initiative aims to outline the motivation and objectives as well as the planned steps ahead 
            towards the establishment of an Cardano multi asset treasury.
          </p>
          
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Ideation</h3>
              <p className={styles.cardContent}>
                Async and in-person initiatives to share ideas, get feedback and ideate the multi asset treasury.
              </p>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Design</h3>
              <p className={styles.cardContent}>
                Design and submit respective CPSs and CIPs to propose design decisions.
              </p>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Implementation</h3>
              <p className={styles.cardContent}>
                Respective governance actions will be submitted to implement the multi asset treasury.
              </p>
            </div>
          </div>
        </section>
        
        <section className={styles.taskBoardSection}>
          <h2 className={styles.sectionTitle}>Progress Tracker</h2>
          <div className={styles.taskBoardContainer}>
            <div className={styles.taskColumn}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>Ideation</span>
                <span className={styles.columnBadge}>In Progress</span>
              </div>
              <div className={styles.columnContent}>
                <div className={styles.emptyColumn}>
                  Tasks will be added here soon
                </div>
              </div>
            </div>
            
            <div className={styles.taskColumn}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>Design</span>
                <span className={styles.columnBadge}>Planned</span>
              </div>
              <div className={styles.columnContent}>
                <div className={styles.emptyColumn}>
                  Tasks will be added here soon
                </div>
              </div>
            </div>
            
            <div className={styles.taskColumn}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>Implementation</span>
                <span className={styles.columnBadge}>Upcoming</span>
              </div>
              <div className={styles.columnContent}>
                <div className={styles.emptyColumn}>
                  Tasks will be added here soon
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
