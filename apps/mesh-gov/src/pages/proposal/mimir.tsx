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

export default function MimirProposal() {
  const router = useRouter();
  const { isLoading, error } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [isProposalModal, setIsProposalModal] = useState(false);

  // Proposal data structure
  const proposalData = {
    // Basic Information
    title: 'Mesh: Mimir - Your AI Copilot for Cardano Development',
    description:
      'Build solutions to optimize and upgrade open source tools and docs for AI models, ensuring AI provides more accurate quality code when building on Cardano',
    category: 'Cardano Use Cases: Concept',
    budget: 100000, // in ADA
    proposer: 'Mesh',
    status: 'Proposed',
    fundRound: 'Fund 14',
    expectedDuration: '6 months',

    // Additional Details
    fullDescription:
      'More and more devs using AI models in day to day coding tasks, yet, due to lack of ai-compatible tools & docs, ai models often output low quality making it difficult to use ai for onchain development. With Mesh Mimir, we build solutions to optimise and upgrade open source tools and docs for ai models, ensuring that ai is able to provide more accurate quality code when building on cardano.',
    githubRepo: 'https://github.com/MeshJS/mimir',
    website: 'https://meshjs.dev',

    // Milestones Array
    milestoneDetails: [
      {
        id: 1,
        title: 'Optimize Documentation',
        description:
          'Re-factor and re-format documentation on all levels to meet the requirements of AI driven development, including AI-optimized inline documentation and web docs',
        budget: 25000,
        duration: 'December 2025',
        outcomes: [
          'Refactored code base featuring ai-optimised inline documentation',
          'Improved web docs focusing on scrapability and compatibility with AI systems',
          'Create & publish a twitter thread to inform the public',
        ],
        acceptanceCriteria: [
          'Completed Refactoring of code base featuring ai-optimised inline documentation',
          'Completed web docs page focusing on scrapability and compatibility with AI systems',
          'Published twitter thread to inform the public on milestone achievements',
        ],
        evidenceOfCompletion: [
          'Link to the respective Pull requests adding inline documentation',
          'Link to the refined web docs page, containing AI ready documentation',
          'Link to a twitter thread to inform the public',
        ],
      },
      {
        id: 2,
        title: 'Build Context Engineering Toolset',
        description:
          'Develop a RAG (Retrieval-Augmented Generation) driven AI assistant embedded in the web docs page to provide contextual help to developers',
        budget: 25000,
        duration: 'January 2026',
        outcomes: [
          'Develop a RAG driven AI assistant embedded in the web docs page',
          'Create & publish a twitter thread to inform the public',
          'Provide URLs to the relevant Pull Requests adding the RAG driven ai-assistant to the code-base',
        ],
        acceptanceCriteria: [
          'Completed web docs integrated AI chat using our RAG solution',
          'Published twitter thread to inform the public',
          'Share link to the relevant Pull Requests adding the RAG driven ai-assistant to the code-base',
        ],
        evidenceOfCompletion: [
          'Link to additional feature "Ask AI" in web docs page',
          'Link to twitter thread to inform the public',
          'Links to relevant Pull Requests adding the RAG driven ai-assistant to the code-base',
        ],
      },
      {
        id: 3,
        title: 'Build MCP Servers',
        description:
          'Create Model Context Protocol servers to allow AI agents to interact directly with the blockchain through Mesh functionalities',
        budget: 20000,
        duration: 'February 2026',
        outcomes: [
          'Mesh-providers MCP for querying Blockchain state, utilizing and covering the Blockfrost API',
          "Mesh-core MCP for using Mesh's low level features",
          'Mesh-transaction MCP for constructing and submitting Transactions',
        ],
        acceptanceCriteria: [
          'Completed Mesh MCP Providers',
          'Completed Mesh MCP Core',
          'Completed Mesh MCP Transactions',
          'Published twitter thread to inform the public',
        ],
        evidenceOfCompletion: [
          'Public MCP Servers with reasonable rate-limits, as well as their open-source code',
          'Link to twitter thread to inform the public',
        ],
      },
      {
        id: 4,
        title: 'Refine Flow & Integration Tests',
        description:
          'Comprehensive testing and refining of the software products, collaborative peer testing with No.Witness labs, and Discord bot showcase',
        budget: 20000,
        duration: 'May 2026',
        outcomes: [
          'Comprehensive testing and refining of the software products built in the previous milestones',
          'Collaborative peer testing with No.Witness labs',
          'Discord bot to showcase the MCP servers abilities',
        ],
        acceptanceCriteria: [
          'Completed overview of internal testing efforts',
          'Completed Test Report for our partner No.Witness labs',
          'Completed Discord bot with small but reasonable rate-limits for bot usage',
          'Published twitter thread to inform the public',
        ],
        evidenceOfCompletion: [
          'Link to Collaborative Test Reports and Discord bot with on-request test access',
          'Link to Twitter thread to inform the public',
          'Links to relevant Pull Requests adding the milestone outcomes to the code-base',
        ],
      },
      {
        id: 5,
        title: 'Wrap up and Final Documentation',
        description:
          'Create close-out report and video, comprehensive user guides, and license all code under open source license',
        budget: 10000,
        duration: 'June 2026',
        outcomes: [
          'Create and submit Proposal Close Out Report',
          'Create and submit Proposal Close Out Video',
          'Create Docs and step-by-step-guide for users on how to use the tools',
          'Create a twitter thread on the milestones completion to inform the public',
          'License all code on a public github repository under a open source licence',
        ],
        acceptanceCriteria: [
          'Completed Close Out Report',
          'Completed Close Out Video',
          'Completed how-to-use guides and Docs',
          'Published twitter thread to inform the public',
          'Published all code under open source licence',
        ],
        evidenceOfCompletion: [
          'Link to completed Close Out Report',
          'Link to completed Close Out Video',
          'Link to completed guides and Docs',
          'Link to the project repository on Mesh github with an active open source license',
          'Link to Twitter thread to inform the public',
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
              src="/mimir.png"
              alt="Mesh Mimir Proposal"
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
                href="https://projectcatalyst.io/funds/14/cardano-use-cases-concepts/mesh-tools-and-docs-for-ai-modelsworkflows"
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

      <YouTubeEmbed videoId="TRNkAgJLo2A" />

      {/* Key Development Areas (full width, no background) */}
      <div className={styles.keyFeaturesSection}>
        <div className={styles.sectionHeader}>
          <h2>Key Development Areas</h2>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.aiDocsIcon}></div>
            </div>
            <h3>AI-Optimized Documentation</h3>
            <p>
              Refactor and reformat documentation at all levels to meet AI requirements, including
              inline code documentation and web docs optimized for AI scraping and understanding.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.ragIcon}></div>
            </div>
            <h3>RAG-Powered AI Assistant</h3>
            <p>
              Develop Retrieval-Augmented Generation system with contextual retrieval to provide
              accurate, up-to-date information and reduce AI hallucination in Cardano development.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.mcpIcon}></div>
            </div>
            <h3>MCP Server Integration</h3>
            <p>
              Build Model Context Protocol servers enabling AI agents to interact directly with
              blockchain through Mesh functionalities, supporting providers, core features, and
              transactions.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <div className={styles.testingIcon}></div>
            </div>
            <h3>Collaborative Testing</h3>
            <p>
              Comprehensive testing framework with peer collaboration, Discord bot showcase, and
              integration tests to ensure reliable AI-assisted Cardano development tools.
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
                                .replace('Refactored', '')
                                .replace('Develop a', '')
                                .replace('Create and submit', '')
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
        projectId={isProposalModal ? 'mimir' : undefined}
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
