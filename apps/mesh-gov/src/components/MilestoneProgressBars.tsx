import { useState } from 'react';
import styles from './MilestoneProgressBars.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { MilestoneContent } from '../types';

interface Props {
  milestones: MilestoneContent[];
  completedCount: number;
  projectTitle: string;
  fundingRound: string;
  totalMilestones: number;
}

export function MilestoneProgressBars({
  milestones,
  completedCount,
  projectTitle,
  fundingRound,
  totalMilestones,
}: Props) {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  // Filter out close-out milestones from regular milestones
  const regularMilestones = milestones.filter(m => !m.isCloseOut);
  const closeOutReport = milestones.find(m => m.isCloseOut);

  // Calculate the actual number of regular milestones (excluding close-out)
  const regularMilestoneCount = regularMilestones.length;
  const allMilestoneNumbers = Array.from({ length: regularMilestoneCount }, (_, i) => i + 1);

  // Map existing milestone data to their numbers
  const milestoneMap = new Map(regularMilestones.map(m => [m.number, m]));

  const markdownComponents: Components = {
    a: ({ node, children, ...props }) => {
      // Extract ref and other problematic props to avoid TypeScript conflicts
      const { ref, ...safeProps } = props;
      return (
        <a {...safeProps} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className={styles.milestoneOverview}>
      <h3 className={styles.milestoneOverviewTitle}>Project Milestones Progress</h3>
      <div className={styles.milestoneGrid}>
        <div className={styles.milestoneRow}>
          <div className={styles.milestoneHeader}>
            <div className={styles.milestoneTitle}>
              <span className={styles.fundTag}>{fundingRound}</span>
              <span className={styles.projectTitle}>{projectTitle}</span>
            </div>
            <div className={styles.milestoneCount}>
              {completedCount}/{regularMilestoneCount}
            </div>
          </div>
          <div className={styles.milestoneBars}>
            {/* Regular milestones */}
            {allMilestoneNumbers.map(number => {
              const milestone = milestoneMap.get(number);
              const isCompleted = number <= completedCount;
              const isExpanded = expandedMilestone === number;

              return (
                <div
                  key={number}
                  className={`${styles.milestoneBarItem} ${isCompleted ? styles.completed : ''} ${isExpanded ? styles.expanded : ''}`}
                  onClick={() => setExpandedMilestone(isExpanded ? null : number)}
                >
                  <div className={styles.milestoneBarHeader}>
                    <span className={styles.milestoneBarTitle}>
                      Milestone {number}
                      {milestone?.budget && (
                        <span className={styles.milestoneBarBudget}>{milestone.budget}</span>
                      )}
                    </span>
                    {milestone?.delivered && (
                      <span className={styles.milestoneBarDelivered}>
                        Delivered: {milestone.delivered}
                      </span>
                    )}
                    <button
                      className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                      onClick={e => {
                        e.stopPropagation();
                        setExpandedMilestone(isExpanded ? null : number);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path
                          fill="currentColor"
                          d={
                            isExpanded
                              ? 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z'
                              : 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z'
                          }
                        />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.milestoneProgressBar}>
                    <div
                      className={styles.milestoneProgressFill}
                      style={{
                        width: isCompleted ? '100%' : '0%',
                        background: isCompleted
                          ? 'linear-gradient(90deg, rgba(56, 232, 225, 0.25), rgba(56, 232, 225, 0.35))'
                          : 'transparent',
                      }}
                    />
                  </div>
                  {isExpanded && milestone && (
                    <div className={styles.milestoneContent}>
                      {milestone.challenge && (
                        <div className={styles.challenge}>
                          <strong>Challenge:</strong> {milestone.challenge}
                        </div>
                      )}
                      <div className={styles.description}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {milestone.content}
                        </ReactMarkdown>
                      </div>
                      {milestone.link && (
                        <a
                          href={milestone.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                          onClick={e => e.stopPropagation()}
                        >
                          View on Project Catalyst →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Close-out report if exists */}
            {closeOutReport && (
              <div
                key="close-out"
                className={`${styles.milestoneBarItem} ${styles.closeOut} ${completedCount >= totalMilestones ? styles.completed : ''} ${expandedMilestone === -1 ? styles.expanded : ''}`}
                onClick={() => setExpandedMilestone(expandedMilestone === -1 ? null : -1)}
              >
                <div className={styles.milestoneBarHeader}>
                  <span className={styles.milestoneBarTitle}>
                    Close-out Report
                    <span className={styles.milestoneBarBudget}>{closeOutReport.budget}</span>
                  </span>
                  <span className={styles.milestoneBarDelivered}>
                    Delivered: {closeOutReport.delivered}
                  </span>
                  <button
                    className={`${styles.expandButton} ${expandedMilestone === -1 ? styles.expanded : ''}`}
                    aria-label={expandedMilestone === -1 ? 'Collapse details' : 'Expand details'}
                    onClick={e => {
                      e.stopPropagation();
                      setExpandedMilestone(expandedMilestone === -1 ? null : -1);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path
                        fill="currentColor"
                        d={
                          expandedMilestone === -1
                            ? 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z'
                            : 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z'
                        }
                      />
                    </svg>
                  </button>
                </div>
                <div className={styles.milestoneProgressBar}>
                  <div
                    className={styles.milestoneProgressFill}
                    style={{
                      width: completedCount >= totalMilestones ? '100%' : '0%',
                      background:
                        completedCount >= totalMilestones
                          ? 'linear-gradient(90deg, rgba(56, 232, 225, 0.25), rgba(56, 232, 225, 0.35))'
                          : 'transparent',
                    }}
                  />
                </div>
                {expandedMilestone === -1 && (
                  <div className={styles.milestoneContent}>
                    {closeOutReport.challenge && (
                      <div className={styles.challenge}>
                        <strong>Challenge:</strong> {closeOutReport.challenge}
                      </div>
                    )}
                    <div className={styles.description}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {closeOutReport.content}
                      </ReactMarkdown>
                    </div>
                    {closeOutReport.link && (
                      <a
                        href={closeOutReport.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                        onClick={e => e.stopPropagation()}
                      >
                        View on Project Catalyst →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
