import { Contributor, ContributorRepository, ContributorStats } from '../types';

export function aggregateContributorStats(yearlyStats: Record<number, ContributorStats>): Contributor[] {
    const contributorMap = new Map<string, Contributor>();

    // Iterate through each year's stats
    Object.values(yearlyStats).forEach(yearStats => {
        yearStats.contributors.forEach(contributor => {
            if (!contributorMap.has(contributor.login)) {
                // Initialize contributor if not exists
                contributorMap.set(contributor.login, {
                    login: contributor.login,
                    avatar_url: contributor.avatar_url,
                    commits: 0,
                    pull_requests: 0,
                    contributions: 0,
                    repositories: []
                });
            }

            const existingContributor = contributorMap.get(contributor.login)!;

            // Update total stats
            existingContributor.commits += contributor.commits;
            existingContributor.pull_requests += contributor.pull_requests;
            existingContributor.contributions += contributor.contributions;

            // Process repositories
            contributor.repositories.forEach(repoStats => {
                let repo = existingContributor.repositories.find(r => r.name === repoStats.name);

                if (!repo) {
                    // Initialize repository if not exists
                    repo = {
                        name: repoStats.name,
                        commits: 0,
                        pull_requests: 0,
                        contributions: 0,
                        commit_timestamps: [],
                        pr_timestamps: []
                    };
                    existingContributor.repositories.push(repo);
                }

                // Update repository stats
                repo.commits += repoStats.commits;
                repo.pull_requests += repoStats.pull_requests;
                repo.contributions += repoStats.contributions;

                // Add timestamps if they exist
                if (repoStats.commit_timestamps) {
                    repo.commit_timestamps.push(...repoStats.commit_timestamps);
                }
                if (repoStats.pr_timestamps) {
                    repo.pr_timestamps.push(...repoStats.pr_timestamps);
                }
            });
        });
    });

    // Convert map to array and sort by total contributions
    return Array.from(contributorMap.values())
        .sort((a, b) => b.contributions - a.contributions);
} 