import { Contributor } from '../types';

export interface FilteredContributorMetrics {
    commits: number;
    pullRequests: number;
    repositories: number;
    contributions: number;
}

/**
 * Parse ISO date string to Date object, handling timezone consistently
 * @param dateString - ISO date string (YYYY-MM-DD format)
 * @returns Date object set to start of day in local timezone
 */
const parseDate = (dateString: string): Date => {
    // Parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Check if a timestamp falls within the given date range
 * @param timestamp - ISO timestamp string
 * @param startDate - Start date string or null
 * @param endDate - End date string or null  
 * @returns boolean indicating if timestamp is within range
 */
const isTimestampInRange = (timestamp: string, startDate: string | null, endDate: string | null): boolean => {
    const date = new Date(timestamp);
    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate) : null;

    // For end date, include the entire day by setting to end of day
    if (end) {
        end.setHours(23, 59, 59, 999);
    }

    return (!start || date >= start) && (!end || date <= end);
};

/**
 * Filter contributor metrics based on time window
 * @param contributor - The contributor to filter
 * @param startDate - Start date for filtering (ISO string) or null for no start limit
 * @param endDate - End date for filtering (ISO string) or null for no end limit
 * @returns Filtered metrics for the specified time window
 */
export const getFilteredMetrics = (
    contributor: Contributor,
    startDate: string | null,
    endDate: string | null
): FilteredContributorMetrics => {
    if (!startDate && !endDate) {
        // No filtering - compute all-time metrics from the provided repositories
        // This ensures correctness when a subset of repositories is supplied
        let totalCommits = 0;
        let totalPRs = 0;
        let activeRepositories = 0;

        contributor.repositories.forEach(repo => {
            const repoCommits = typeof repo.commits === 'number' ? repo.commits : repo.commit_timestamps.length;
            const repoPRs = typeof repo.pull_requests === 'number' ? repo.pull_requests : repo.pr_timestamps.length;

            totalCommits += repoCommits;
            totalPRs += repoPRs;

            if (repoCommits > 0 || repoPRs > 0) {
                activeRepositories++;
            }
        });

        return {
            commits: totalCommits,
            pullRequests: totalPRs,
            repositories: activeRepositories,
            contributions: totalCommits + totalPRs
        };
    }

    let filteredCommits = 0;
    let filteredPRs = 0;
    let activeRepositories = 0;

    contributor.repositories.forEach(repo => {
        let repoCommits = 0;
        let repoPRs = 0;

        // Count commits within time window
        repo.commit_timestamps.forEach(timestamp => {
            if (isTimestampInRange(timestamp, startDate, endDate)) {
                repoCommits++;
            }
        });

        // Count PRs within time window
        repo.pr_timestamps.forEach(timestamp => {
            if (isTimestampInRange(timestamp, startDate, endDate)) {
                repoPRs++;
            }
        });

        filteredCommits += repoCommits;
        filteredPRs += repoPRs;

        // Count repository as active if it has contributions in the time window
        if (repoCommits > 0 || repoPRs > 0) {
            activeRepositories++;
        }
    });

    return {
        commits: filteredCommits,
        pullRequests: filteredPRs,
        repositories: activeRepositories,
        contributions: filteredCommits + filteredPRs
    };
};

/**
 * Calculate summary metrics for all contributors within a time window
 * @param contributors - Array of contributors to analyze
 * @param startDate - Start date for filtering (ISO string) or null for no start limit
 * @param endDate - End date for filtering (ISO string) or null for no end limit
 * @returns Summary metrics for all contributors
 */
export const getFilteredSummaryMetrics = (
    contributors: Contributor[],
    startDate: string | null,
    endDate: string | null
) => {
    let totalCommits = 0;
    let totalPRs = 0;
    let activeContributors = 0;
    const activeRepositories = new Set<string>();

    contributors.forEach(contributor => {
        const filtered = getFilteredMetrics(contributor, startDate, endDate);
        totalCommits += filtered.commits;
        totalPRs += filtered.pullRequests;

        if (filtered.contributions > 0) {
            activeContributors++;
        }

        // Count active repositories efficiently
        contributor.repositories.forEach(repo => {
            const hasCommits = repo.commit_timestamps.some(timestamp =>
                isTimestampInRange(timestamp, startDate, endDate)
            );

            const hasPRs = repo.pr_timestamps.some(timestamp =>
                isTimestampInRange(timestamp, startDate, endDate)
            );

            if (hasCommits || hasPRs) {
                activeRepositories.add(repo.name);
            }
        });
    });

    return {
        totalCommits,
        totalPRs,
        activeContributors,
        activeRepositories: activeRepositories.size
    };
}; 