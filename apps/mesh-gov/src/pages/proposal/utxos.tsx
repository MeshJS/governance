import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../contexts/DataContext';
import { ProposalFullContentModal } from '../../components/ProposalFullContentModal';
import styles from '../../styles/ProposalDetail.module.css';

export default function UtxosProposal() {
  const router = useRouter();
  const { isLoading, error } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [isProposalModal, setIsProposalModal] = useState(false);

  // Proposal data structure
  const proposalData = {
    // Basic Information
    title: 'Mesh UTXOS: Supercharge Business Onboarding to Cardano',
    description:
      'UTXOS provides wallet-as-a-service, transaction sponsorship, and fiat on-ramp, enabling seamless onboarding and adoption for Cardano and Bitcoin apps',
    category: 'Cardano Use Cases: Products & Partnerships',
    budget: 490000, // in ADA
    proposer: 'Mesh',
    status: 'Proposed',
    fundRound: 'Fund 14',
    expectedDuration: '8 months',

    // Additional Details
    fullDescription:
      'Cardano and Bitcoin lack business-ready onboarding tools such as non custodial wallets, social logins and gasless transactions, leaving them behind ecosystems like Ethereum. UTXOS provides wallet-as-a-service, transaction sponsorship, and fiat on-ramp, enabling seamless onboarding and adoption for Cardano and Bitcoin apps.',
    githubRepo: 'https://github.com/MeshJS/web3-sdk',
    website: 'https://utxos.dev',

    // Milestones Array
    milestoneDetails: [
      {
        id: 1,
        title: 'Wallet as a Service & Transaction Sponsorship',
        description:
          'Develop wallet-as-a-service with social logins, recoverable wallets, white label solution, and transaction sponsorship capabilities',
        budget: 145000,
        duration: 'Dec-Jan',
        outcomes: [
          'Wallet as a service',
          'Integrate social logins',
          'Recoverable and exportable',
          'White label solution',
          'Third-party auth support',
          'Transaction sponsorship',
          'SDK for transaction sponsorship',
          "Successful sponsored transactions with a few partners' transactions",
        ],
        acceptanceCriteria: [
          'Completed social login bitcoin and cardano wallet feature',
          'Completed recover & export wallet feature',
          'Completed transaction sponsorship feature',
        ],
        evidenceOfCompletion: [
          'Features completed and available at utxos on mainnet',
          'Public link to Twitter/X Post to inform the public',
        ],
      },
      {
        id: 2,
        title: 'Fiat On-Ramp & KYC Integration',
        description:
          'Develop and deploy full integration with Mercuryo for fiat on-ramp and KYC processes to enable seamless fiat-to-crypto conversion',
        budget: 145000,
        duration: 'Feb-Mar',
        outcomes: [
          'Fiat on-ramp',
          'Develop and deploy full integration with Mercuryo for on-ramp and KYC processes',
          'Twitter thread of inform the public on the milestone completion',
        ],
        acceptanceCriteria: ['Completed integration with Mercuryo as on-ramp provider for UTXOS'],
        evidenceOfCompletion: [
          'Features completed and available at utxos on mainnet',
          'Public link to Twitter/X Post to inform the public',
        ],
      },
      {
        id: 3,
        title: 'Wallet Security Implementation',
        description:
          'Secure user wallets with web security provider (preferably Checkpoint) and implement real-time threat intelligence',
        budget: 145000,
        duration: 'Apr-May',
        outcomes: [
          'Secure users wallets with web security provider (preferably Checkpoint)',
          'Enable all user wallets to be screened for attacks',
          'Implement 2 way communication to get real-time threat intelligence with a web security provider',
        ],
        acceptanceCriteria: [
          'Completed to secure user wallets',
          'Completed wallet screening for attacks',
          'Completed 2-way communicator for real-time threat intelligence with the web security provider',
        ],
        evidenceOfCompletion: [
          'Features completed and available at utxos on mainnet',
          'Public link to Twitter/X Post to inform the public',
        ],
      },
      {
        id: 4,
        title: 'Product Launch',
        description:
          'Launch UTXOS with at least 10 clients, complete and launch the updated SDK, and publish comprehensive developer documentation',
        budget: 45000,
        duration: 'June',
        outcomes: [
          'Product Launch',
          'Launch UTXOS with at least 10 clients',
          'Complete & launch the updated SDK for UTXOS',
          'Complete & publish Docs for developers for UTXOS',
        ],
        acceptanceCriteria: [
          'Completed to launch the updated UTXOS SDK',
          'Completed the creation of UTXOS Developer documentation',
          'Completed to launch UTXOS with at least 10 clients',
          'Published a Twitter thread to inform the public',
        ],
        evidenceOfCompletion: [
          'Public link to UTXOS SDK',
          'Public link to Docs',
          'Public link to concise report on completed launch with at least 10 Clients',
          'Public link to Twitter/X Post to inform the public',
        ],
      },
      {
        id: 5,
        title: 'Proposal Close-Out & Metrics',
        description:
          'Create official close-out report and video, publish success metrics, and include UTXOS usage data on Mesh Dashboard',
        budget: 10000,
        duration: 'July',
        outcomes: [
          'Create the official close out report',
          'Create the official close out video',
          'Publish a Twitter thread to inform the public on the successful milestone & proposal completion',
          'Include UTXOS usage and development pulse on the Mesh Dashboard',
        ],
        acceptanceCriteria: [
          'Complete and submit the official Close out Video',
          'Complete and submit the official Close out Report',
          'Publish a Twitter thread to inform the Public',
          'Include UTXOS usage & metrics on Mesh Dashboard',
        ],
        evidenceOfCompletion: [
          'Public link to the Close Out Video',
          'Public link to the Close Out Report',
          'Public link to Twitter/X Post to inform the public',
          'Public link to usage & metrics page on Mesh dashboard',
        ],
      },
    ],
  };

  // Helper functions
  const formatBudget = (amount: number): string => {
    return `₳${amount.toLocaleString()}`;
  };

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'Draft':
        return styles.statusDraft;
      case 'Under Review':
        return styles.statusUnderReview;
      case 'Voting':
        return styles.statusVoting;
      case 'Approved':
        return styles.statusApproved;
      case 'Rejected':
        return styles.statusRejected;
      case 'Proposed':
        return styles.statusProposed;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeader
        title={
          <>
            Proposal <span>Details</span>
          </>
        }
        subtitle="Detailed information about this Catalyst proposal"
      />

      {/* Proposal Header Section */}
      <div className={styles.proposalHeader}>
        <div className={styles.headerTop}>
          <div className={styles.badges}>
            <span className={getStatusStyle(proposalData.status)}>{proposalData.status}</span>
            <span className={styles.fundRound}>{proposalData.fundRound}</span>
          </div>
          <button className={styles.backButton} onClick={() => router.back()}>
            ← Back
          </button>
        </div>
        <h1 className={styles.title}>{proposalData.title}</h1>
        <p className={styles.shortDescription}>{proposalData.description}</p>
      </div>

      {/* Main Content Grid */}
      <div className={styles.content}>
        <div className={styles.mainContent}>
          {/* Image section (no background styling) */}
          <div className={styles.imageSection}>
            <Image
              src="/utxos.png"
              alt="UTXOS Proposal"
              width={400}
              height={250}
              className={styles.proposalImage}
            />
          </div>
        </div>
        <div className={styles.sidebar}>
          {/* Proposal Information */}
          <div className={styles.infoCard}>
            <h3>Proposal Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Project Catalyst</span>
                <span className={styles.infoValue}>{proposalData.fundRound}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Category</span>
                <span className={styles.infoValue}>{proposalData.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Proposal Budget</span>
                <span className={styles.infoValue}>{formatBudget(proposalData.budget)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Proposer</span>
                <span className={styles.infoValue}>{proposalData.proposer}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Duration</span>
                <span className={styles.infoValue}>{proposalData.expectedDuration}</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className={styles.linksCard}>
            <h3>Resources</h3>
            <div className={styles.linksList}>
              <button
                className={styles.readFullProposalButton}
                onClick={() => {
                  setIsProposalModal(true);
                  setIsModalOpen(true);
                }}
              >
                Read Full Proposal
              </button>
              <a
                href={proposalData.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                GitHub Repository
              </a>
              <a
                href={proposalData.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                Project Website
              </a>
              <a
                href="https://projectcatalyst.io/funds/14/cardano-use-cases-partners-and-products/mesh-utxos-x-mercuryo-mastercard-x-checkpoint"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.resourceLink}
              >
                Proposal On Catalyst
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Key Development Areas (full width, no background) */}
      <div className={styles.keyFeaturesSection}>
        <div className={styles.sectionHeader}>
          <h2>Key Development Areas</h2>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.walletIcon}></div>
            </div>
            <h3>Wallet-as-a-Service</h3>
            <p>
              Complete wallet infrastructure with social logins, recoverable wallets, white label
              solutions, and third-party authentication support for seamless user onboarding.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.transactionIcon}></div>
            </div>
            <h3>Transaction Sponsorship</h3>
            <p>
              Enable gasless transactions through transaction sponsorship, allowing businesses to
              cover transaction costs for their users and remove onboarding friction.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.securityIcon}></div>
            </div>
            <h3>Fiat On-Ramp & Security</h3>
            <p>
              Integrated fiat-to-crypto conversion through Mercuryo partnership and advanced
              security features with Checkpoint integration for wallet protection.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.businessIcon}></div>
            </div>
            <h3>Business Onboarding</h3>
            <p>
              Comprehensive SDK and documentation designed for business adoption, enabling rapid
              integration and scaling of Cardano and Bitcoin applications.
            </p>
          </div>
        </div>
      </div>

      {/* Proposal Milestones (full width) */}
      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.milestonesSection}>
            <h2>Proposal Milestones</h2>
            <div className={styles.roadmapContainer}>
              <div className={styles.roadmapTimeline}>
                {proposalData.milestoneDetails.map((milestone, index) => {
                  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
                  return (
                    <div
                      key={milestone.id}
                      className={`${styles.roadmapItem} ${styles.clickableRoadmapItem}`}
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setIsProposalModal(false);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className={styles.roadmapIcon}>
                        <span className={styles.milestoneRoman}>{romanNumerals[index]}</span>
                      </div>

                      <div className={styles.roadmapContent}>
                        <div className={styles.roadmapHeader}>
                          <h3>{milestone.title}</h3>
                          <div className={styles.roadmapMeta}>
                            <span className={styles.roadmapBudget}>
                              {formatBudget(milestone.budget)}
                            </span>
                            <span className={styles.roadmapDate}>{milestone.duration}</span>
                          </div>
                        </div>

                        <p className={styles.roadmapDescription}>{milestone.description}</p>

                        <div className={styles.roadmapTags}>
                          {milestone.outcomes.slice(0, 3).map((outcome, idx) => (
                            <span key={idx} className={styles.roadmapTag}>
                              {outcome
                                .replace('Develop and deploy', '')
                                .replace('Complete &', '')
                                .replace('Create', '')
                                .trim()}
                            </span>
                          ))}
                          <span className={styles.clickHint}>Click for details →</span>
                        </div>
                      </div>

                      {index < proposalData.milestoneDetails.length - 1 && (
                        <div className={styles.roadmapConnector}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      <ProposalFullContentModal
        projectId={isProposalModal ? 'utxos' : undefined}
        milestoneData={!isProposalModal ? selectedMilestone : undefined}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMilestone(null);
          setIsProposalModal(false);
        }}
      />
    </div>
  );
}
