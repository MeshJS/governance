import { useState } from 'react';
import styles from './MilestoneList.module.css';
import { MilestoneContent } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { AnchorHTMLAttributes } from 'react';

interface MilestoneListProps {
  milestones: MilestoneContent[];
  completedCount: number;
}

export function MilestoneList({ milestones, completedCount }: MilestoneListProps) {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  // Sort milestones by number, putting close-out report at the end
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.isCloseOut) return 1;
    if (b.isCloseOut) return -1;
    return a.number - b.number;
  });

  const markdownComponents: Components = {
    a: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <div className={styles.milestoneList}>
      <h2 className={styles.title}>Milestone Reports</h2>
      <div className={styles.grid}>
        {sortedMilestones.map((milestone, index) => {
          const isCompleted = index < completedCount;
          const isExpanded = expandedMilestone === milestone.number;

          return (
            <div
              key={milestone.number}
              className={`${styles.milestone} ${isCompleted ? styles.completed : ''} ${milestone.isCloseOut ? styles.closeOut : ''} ${isExpanded ? styles.expanded : ''}`}
              onClick={() => setExpandedMilestone(isExpanded ? null : milestone.number)}
            >
              <div className={styles.header}>
                <div className={styles.milestoneInfo}>
                  <div className={styles.number}>
                    <div className={styles.circle}>
                      {milestone.isCloseOut ? '★' : isCompleted ? '✓' : milestone.number}
                    </div>
                  </div>
                  <div className={styles.details}>
                    <h3>
                      {milestone.isCloseOut ? 'Close-out Report' : `Milestone ${milestone.number}`}
                    </h3>
                    <div className={styles.metadata}>
                      {milestone.budget && <span>{milestone.budget}</span>}
                      {milestone.delivered && <span>Due: {milestone.delivered}</span>}
                    </div>
                  </div>
                </div>
                <button
                  className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
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
              {isExpanded && (
                <div className={styles.content}>
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
      </div>
    </div>
  );
}
