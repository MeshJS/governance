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
              <h3 className={styles.cardTitle}>Enable Multi-Asset Treasury Functionality</h3>
              <div className={styles.cardContent}>
                <div className={styles.objectiveSection}>
                  <p><strong>Objective:</strong> Introduce the ledger-level capability for the Cardano treasury to hold, manage, and disburse multiple Cardano Native Tokens (CNTs), including stablecoins and partner-chain tokens.</p>
                </div>
                <div className={styles.purposeSection}>
                  <p><strong>Purpose:</strong> Expand beyond ada-only holdings to support stable-value funding, diversified treasury strategies, and economic possibilites across Cardano Partner Chains.</p>
                </div>
              </div>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Strengthen Financial Stability and Predictability</h3>
              <div className={styles.cardContent}>
                <div className={styles.objectiveSection}>
                  <p><strong>Objective:</strong> Allow treasury-funded projects to budget and receive funds in stable-value assets, mitigating ada price volatility.</p>
                </div>
                <div className={styles.purposeSection}>
                  <p><strong>Purpose:</strong> Provide sustainable, predictable funding conditions for long-term ecosystem development and critical infrastructure maintenance.</p>
                </div>
              </div>
            </div>
            
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Establish Governance and Security Frameworks</h3>
              <div className={styles.cardContent}>
                <div className={styles.objectiveSection}>
                  <p><strong>Objective:</strong> Define constitutional and governance mechanisms (via CIP updates such as CIP-1694 and new governance actions) that regulate which assets can enter the treasury and how they are managed.</p>
                </div>
                <div className={styles.purposeSection}>
                  <p><strong>Purpose:</strong> Ensure responsible financial stewardship, prevent spam or malicious asset deposits, and uphold Cardano's on-chain governance principles.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.taskBoardSection}>
          <h2 className={styles.sectionTitle}>Roadmap (WIP)</h2>
          <div className={styles.taskBoardContainer}>
            <div className={styles.taskColumn}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>Ideation</span>
                <span className={styles.columnBadge}>In Progress</span>
              </div>
              <div className={styles.columnDescription}>
                <p>Async and in-person initiatives to share ideas, get feedback and ideate the multi asset treasury.</p>
              </div>
              <div className={styles.columnContent}>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Draft & Publish CMAT Forum post</h4>
                    <span className={`${styles.taskStatus} ${styles.done}`}>Done</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson, Felix</div>
                    <div className={styles.taskDate}>September</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Draft & publish an initial CMAT introduction post on the Cardano Forum
                  </p>
                  <div className={styles.taskLinks}>
                    <a
                      href="https://docs.google.com/document/d/1SCxDwppfsLyLpT-Rt5lmCQI04fP_dlwsVq2_jOBldm8/edit?tab=t.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      Draft
                    </a>
                    <a
                      href="https://forum.cardano.org/t/cardano-multi-asset-treasury-cmat/149984"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      Forum
                    </a>
                  </div>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Draft & Publish CMAT CPS </h4>
                    <span className={`${styles.taskStatus} ${styles.done}`}>Done</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson, Felix, Nicolas</div>
                    <div className={styles.taskDate}>October</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Draft & publish the initial CPS (Cardano Problem Statement)
                  </p>
                  <div className={styles.taskLinks}>
                    <a
                      href="https://hackmd.io/@Mesh-Team/BkfaE1Z0ge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      Draft
                    </a>
                    <a
                      href="https://hackmd.io/@Mesh-Team/BkfaE1Z0ge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      Github
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.taskColumn}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>Design</span>
                <span className={styles.columnBadge}>Planned</span>
              </div>
              <div className={styles.columnDescription}>
                <p>Design and submit respective CPSs and CIPs to propose design decisions.</p>
              </div>
              <div className={styles.columnContent}>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Ambassador CMAT Session</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson, Felix</div>
                    <div className={styles.taskDate}>November 8</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Prepare and host a CMAT session at the Cardano Ambassadors workshop
                  </p>
                  <div className={styles.taskLinks}>
                    <a
                      href="https://ambassador-workshop.netlify.app/agenda/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      Agenda
                    </a>
                  </div>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Cardano Summit Workshop</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson, Felix, Nicolas</div>
                    <div className={styles.taskDate}>November 11</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Prepare and host a CMAT workshop at the Cardano Summit Day0 Event
                  </p>
                  <div className={styles.taskLinks}>
                    <a
                      href="https://luma.com/geuyhoq1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.taskLink}
                    >
                      Event
                    </a>
                  </div>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Cardano Summit Roundtable</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson, Nicolas, Sam, Yogi</div>
                    <div className={styles.taskDate}>November 11</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Prepare and host a CAMT Roundtable discussion on Summit Day0 Event
                  </p>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>CPS becomes CIP</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson, Felix, Nicolas</div>
                    <div className={styles.taskDate}>December</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Draft & submit the initial CMAT CIP (Cardano Improvement Proposal) based on the initial CMAT CPS (Cardano Problem Statement)
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.taskColumn}>
              <div className={styles.columnHeader}>
                <span className={styles.columnTitle}>Implementation</span>
                <span className={styles.columnBadge}>Upcoming</span>
              </div>
              <div className={styles.columnDescription}>
                <p>Respective governance actions will be submitted to implement the multi asset treasury.</p>
              </div>
              <div className={styles.columnContent}>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Submit CMAT Info Action</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson</div>
                    <div className={styles.taskDate}>January</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Submit an info action to introduce CMAT CIP to voters
                  </p>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Submit CMAT Constitution updates</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson</div>
                    <div className={styles.taskDate}>January</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Submit a &quot;Update to the constitution&quot; gov action according to CMAT requirements
                  </p>
                </div>
                <div className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <h4 className={styles.taskTitle}>Submit CMAT Hard Fork Initiation</h4>
                    <span className={`${styles.taskStatus} ${styles.planned}`}>TODO</span>
                  </div>
                  <div className={styles.taskMeta}>
                    <div className={styles.taskAssignee}>Charge: Hinson</div>
                    <div className={styles.taskDate}>January</div>
                  </div>
                  <p className={styles.taskDescription}>
                    Submit a &quot;Hard Fork Initiation&quot; gov action to initiate the CMAT Hard Fork
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
