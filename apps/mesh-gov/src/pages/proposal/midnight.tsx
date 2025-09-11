import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import PageHeader from '../../components/PageHeader';
import { useData } from '../../contexts/DataContext';
import { ProposalFullContentModal } from '../../components/ProposalFullContentModal';
import styles from '../../styles/ProposalDetail.module.css';
import videoStyles from '../../styles/Proposals.module.css';

const YouTubeEmbed = ({ videoId }: { videoId: string }) => {
  return (
    <div className={videoStyles.videoContainer}>
      <div className={videoStyles.videoWrapper}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={videoStyles.videoIframe}
        />
      </div>
    </div>
  );
};

export default function MidnightProposal() {
  const router = useRouter();
  const { isLoading, error } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [isProposalModal, setIsProposalModal] = useState(false);

  // Proposal data structure
  const proposalData = {
    // Basic Information
    title: 'Mesh: Privacy-Enabled Smart Contracts and UI for Midnight',
    description:
      'Build and deliver modular smart contracts and UI templates, supported by a reusable framework, enabling developers to deploy privacy-enabled apps and reuse them across real-world cases',
    category: 'Cardano Open: Developers',
    budget: 65000, // in ADA
    proposer: 'Mesh Core Team',
    status: 'Proposed',
    fundRound: 'Fund 14',
    expectedDuration: '10 months',

    // Additional Details
    fullDescription:
      'We will create four modular smart contracts with integrated UI, API, and testing: Tokenization (minting, burning, fractionalizing assets), Staking (delegation mechanics and rewards distribution), Identity (DID flows and provider integration), and Oracles (secure on-chain data feed consumption). These will be reusable templates, delivered within a structured framework that streamlines the full development lifecycle.',
    githubRepo: 'https://github.com/MeshJS/midnight-starter-template',
    website: 'https://meshjs.dev/',

    // Milestones Array
    milestoneDetails: [
      {
        id: 1,
        title: 'Implementation of Tokenization Contract',
        description:
          'Develop smart contract logic and witness code for token minting, burning, and fractionalization with comprehensive testing framework',
        budget: 20000,
        duration: 'Month 3',
        outcomes: [
          'Smart contract logic and witness code for token minting, burning, and fractionalization',
          'Logical test and smart contract test framework applied',
          'API implementation with TUI interface and test framework with providers and network',
          'React components and hooks for integration',
        ],
        acceptanceCriteria: [
          'Operational contract in both standalone and testnet environments',
          'API endpoints and CLI commands functional and documented',
          'UI example demonstrating contract integration',
        ],
        evidenceOfCompletion: [
          'GitHub repo with updates to: Contracts folder, API folder and Frontend folder',
          'Demo video and documentation',
        ],
      },
      {
        id: 2,
        title: 'Implementation of Staking Contract',
        description:
          'Create staking logic with delegation mechanics, rewards distribution, and comprehensive testing framework',
        budget: 20000,
        duration: 'Month 6',
        outcomes: [
          'Smart contract logic and witness code for staking and rewards',
          'Logical test and smart contract test framework applied',
          'API implementation with TUI interface and test framework with providers and network',
          'UI integration components',
        ],
        acceptanceCriteria: [
          'Fully tested and documented staking contract',
          'CLI commands for delegation, staking, and withdrawal',
          'React hooks and usage example in frontend',
        ],
        evidenceOfCompletion: [
          'GitHub repo with updates to: Contracts folder, API folder and Frontend folder',
          'Demonstration and accompanying documentation',
        ],
      },
      {
        id: 3,
        title: 'Identity & Oracle Contracts',
        description:
          'Develop DID flows, provider integration, and secure on-chain data feed consumption with complete testing suite',
        budget: 20000,
        duration: 'Month 9',
        outcomes: [
          'Smart contract logic and witness code for both Identity and Oracle contracts',
          'Logical test and smart contract test framework applied',
          'API implementation with TUI interface and test framework with providers and network',
          'React integration components',
        ],
        acceptanceCriteria: [
          'Identity and Oracle contracts fully operational',
          'Full end-to-end tests and documentation',
          'Frontend support and examples ready',
        ],
        evidenceOfCompletion: [
          'GitHub repo with updates to: Contracts folder, API folder and Frontend folder',
          'Demo video and final documentation',
        ],
      },
      {
        id: 4,
        title: 'Close-out Report and Documentation',
        description:
          'Final documentation, video walkthrough, and comprehensive reporting of the complete framework',
        budget: 5000,
        duration: 'Month 10',
        outcomes: [
          'Final close out report with architecture, implementation highlights, and insights',
          'Visual framework diagram and usage guide',
          'Video walkthrough of the full stack and sample interactions',
          'Final close out video, summarising the proposal journey',
        ],
        acceptanceCriteria: [
          'Clear documentation of contracts, APIs, and UI glue',
          'Developer onboarding instructions',
          'Video that demonstrates full workflow and value',
          'Completed Close out report and video',
        ],
        evidenceOfCompletion: [
          'GitHub repository and README finalized',
          'Public YouTube video walkthrough',
          'Link to Close out Report and Video',
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
      {/* 1. Page Header */}
      <PageHeader
        title={
          <>
            Proposal <span>Details</span>
          </>
        }
        subtitle="Detailed information about this Catalyst proposal"
      />

      {/* 2. Proposal Header Section */}
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

      {/* 3. Main Content Grid */}
      <div className={styles.content}>
        <div className={styles.mainContent}>
          {/* Image section (no background styling) */}
          <div className={styles.imageSection}>
            <Image
              src="/midnight.png"
              alt="Midnight Privacy Tooling Proposal"
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
                href="https://projectcatalyst.io/funds/14/cardano-open-developers/mesh-privacy-enabled-smart-contracts-and-ui-for-midnight"
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

      <YouTubeEmbed videoId="-_DUEdQoJwg" />

      {/* 4. Key Development Areas (full width, no background) */}
      <div className={styles.keyFeaturesSection}>
        <div className={styles.sectionHeader}>
          <h2>Key Development Areas</h2>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.tokenIcon}></div>
            </div>
            <h3>Tokenization Framework</h3>
            <p>
              Complete smart contract solution for minting, burning, and fractionalizing assets with
              integrated UI components
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.stakingIcon}></div>
            </div>
            <h3>Staking Infrastructure</h3>
            <p>
              Delegation mechanics and rewards distribution system with comprehensive testing
              framework
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.identityIcon}></div>
            </div>
            <h3>Identity Solutions</h3>
            <p>
              DID flows and provider integration for privacy-preserving identity management on
              Midnight
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.oracleIcon}></div>
            </div>
            <h3>Oracle Integration</h3>
            <p>
              Secure on-chain data feed consumption with reliable external data integration patterns
            </p>
          </div>
        </div>
      </div>

      {/* 5. Proposal Milestones (full width) */}
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
                                .replace('Smart contract logic and witness code for', '')
                                .replace('API implementation with', '')
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

      {/* 6. Modal Component */}
      <ProposalFullContentModal
        projectId={isProposalModal ? 'midnight' : undefined}
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
