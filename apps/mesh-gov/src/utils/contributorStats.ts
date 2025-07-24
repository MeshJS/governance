import { Contributor, ContributorRepository, ContributorStats } from '../types';
import config from '../../config';

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
                    repositories: [],
                    repoNames: []
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

                // Add repo name to repoNames array if not already present
                if (!existingContributor.repoNames.includes(repoStats.name)) {
                    existingContributor.repoNames.push(repoStats.name);
                }
            });
        });
    });

    // Convert map to array, filter for contributors with commits or merged pull requests, and sort by total contributions
    return Array.from(contributorMap.values())
        .filter(contributor => contributor.commits > 0 || contributor.pull_requests > 0)
        .sort((a, b) => b.contributions - a.contributions);
}

/**
 * Aggregates raw GitHub API data into per-contributor, per-repo, and org-wide stats.
 * Only counts commits by author_id (not committer_id).
 * @param contributorsApiData Array of contributors (from /api/github)
 * @param commitsApiData Array of commits (from /api/github/commits)
 * @param pullRequestsApiData Array of pull requests (from /api/github/pull-requests)
 * @param issuesApiData Array of issues (from /api/github/issues)
 * @param reposApiData Array of repos (from /api/github/repos)
 * @returns {
 *   total_commits, total_pull_requests, total_issues, total_contributions, unique_count, lastFetched,
 *   contributors: Contributor[],
 *   perRepo: Record<repoName, { total_commits, total_pull_requests, total_issues, contributors: Contributor[], issues: any[], commits: any[], pullRequests: any[] }>
 * }
 */
export function aggregateApiContributorStats({
    contributorsApiData = [],
    commitsApiData = [],
    pullRequestsApiData = [],
    issuesApiData = [],
    reposApiData = []
}: {
    contributorsApiData: any[];
    commitsApiData: any[];
    pullRequestsApiData: any[];
    issuesApiData: any[];
    reposApiData: any[];
}) {
    // Build repoId -> repoName map
    const repoIdToName: Record<number, string> = {};
    reposApiData.forEach((repo: any) => {
        repoIdToName[repo.id] = repo.name;
    });
    // Helper: get org login (always the same)
    const orgLogin = config.mainOrganization.name;
    // Build contributorId -> contributor info map
    const contributorIdToInfo: Record<number, any> = {};
    contributorsApiData.forEach((contributor: any) => {
        contributorIdToInfo[contributor.id] = contributor;
    });
    // Helper: get login/avatar for a contributorId
    function getContributorInfo(id: number) {
        return contributorIdToInfo[id] || { login: `unknown-${id}`, avatar_url: '' };
    }
    // Per-contributor stats: login -> Contributor
    const contributorMap = new Map<string, import('../types').Contributor>();
    // Per-repo stats: repoName -> { total_commits, total_pull_requests, total_issues, contributors: Map<login, Contributor> }
    const perRepoMap = new Map<string, {
        total_commits: number;
        total_pull_requests: number;
        total_issues: number;
        contributors: Map<string, import('../types').Contributor>;
        issues: any[];
        commits: any[];
        pullRequests: any[];
    }>();
    // Org-wide totals
    let total_commits = 0;
    let total_pull_requests = 0;
    let total_issues = 0;
    let total_contributions = 0;
    let unique_count = 0;
    let lastFetched = Date.now();
    // Aggregate commits (ONLY by author_id)
    commitsApiData.forEach((commit: any) => {
        const repoName = commit.repo?.name || repoIdToName[commit.repo_id] || 'unknown-repo';
        const authorId = commit.author_id;
        if (!authorId) return;
        const { login, avatar_url } = getContributorInfo(authorId);
        // Contributor global
        if (!contributorMap.has(login)) {
            contributorMap.set(login, {
                login,
                avatar_url,
                commits: 0,
                pull_requests: 0,
                contributions: 0,
                repositories: [],
                repoNames: []
            });
        }
        const contributor = contributorMap.get(login)!;
        contributor.commits += 1;
        contributor.contributions += 1;
        // Contributor per-repo
        let repoStats = contributor.repositories.find(r => r.name === repoName);
        if (!repoStats) {
            repoStats = {
                name: repoName,
                commits: 0,
                pull_requests: 0,
                contributions: 0,
                commit_timestamps: [],
                pr_timestamps: []
            };
            contributor.repositories.push(repoStats);
        }
        repoStats.commits += 1;
        repoStats.contributions += 1;
        if (commit.date) {
            repoStats.commit_timestamps.push(commit.date);
        }
        // Add repo name to repoNames array if not already present
        if (!contributor.repoNames.includes(repoName)) {
            contributor.repoNames.push(repoName);
        }
        // Per-repo global
        if (!perRepoMap.has(repoName)) {
            perRepoMap.set(repoName, {
                total_commits: 0,
                total_pull_requests: 0,
                total_issues: 0,
                contributors: new Map(),
                issues: [],
                commits: [],
                pullRequests: []
            });
        }
        const repoAgg = perRepoMap.get(repoName)!;
        repoAgg.total_commits += 1;
        // Add detailed commit information
        repoAgg.commits.push({
            id: commit.id,
            sha: commit.sha,
            message: commit.message,
            date: commit.date,
            author_id: commit.author_id,
            committer_id: commit.committer_id,
            repo_id: commit.repo_id,
            repo: commit.repo,
            user: getContributorInfo(commit.author_id),
            additions: commit.additions,
            deletions: commit.deletions,
            files_changed: commit.files_changed,
            url: (orgLogin && repoName && commit.sha) ? `https://github.com/${orgLogin}/${repoName}/commit/${commit.sha}` : null
        });
        if (!repoAgg.contributors.has(login)) {
            repoAgg.contributors.set(login, {
                login,
                avatar_url,
                commits: 0,
                pull_requests: 0,
                contributions: 0,
                repositories: [],
                repoNames: []
            });
        }
        const repoContributor = repoAgg.contributors.get(login)!;
        repoContributor.commits += 1;
        repoContributor.contributions += 1;
        total_commits += 1;
        total_contributions += 1;
    });
    // Aggregate pull requests (only merged ones)
    pullRequestsApiData.forEach((pr: any) => {
        if (!pr.merged_at) return;
        const repoName = pr.repo?.name || repoIdToName[pr.repo_id] || 'unknown-repo';
        const contributorIds = new Set([pr.user_id, pr.merged_by_id]);
        contributorIds.forEach((contributorId: number | undefined) => {
            if (!contributorId) return;
            const { login, avatar_url } = getContributorInfo(contributorId);
            if (!contributorMap.has(login)) {
                contributorMap.set(login, {
                    login,
                    avatar_url,
                    commits: 0,
                    pull_requests: 0,
                    contributions: 0,
                    repositories: [],
                    repoNames: []
                });
            }
            const contributor = contributorMap.get(login)!;
            contributor.pull_requests += 1;
            contributor.contributions += 1;
            let repoStats = contributor.repositories.find(r => r.name === repoName);
            if (!repoStats) {
                repoStats = {
                    name: repoName,
                    commits: 0,
                    pull_requests: 0,
                    contributions: 0,
                    commit_timestamps: [],
                    pr_timestamps: []
                };
                contributor.repositories.push(repoStats);
            }
            repoStats.pull_requests += 1;
            repoStats.contributions += 1;
            if (pr.merged_at) {
                repoStats.pr_timestamps.push(pr.merged_at);
            }
            if (!contributor.repoNames.includes(repoName)) {
                contributor.repoNames.push(repoName);
            }
            if (!perRepoMap.has(repoName)) {
                perRepoMap.set(repoName, {
                    total_commits: 0,
                    total_pull_requests: 0,
                    total_issues: 0,
                    contributors: new Map(),
                    issues: [],
                    commits: [],
                    pullRequests: []
                });
            }
            const repoAgg = perRepoMap.get(repoName)!;
            repoAgg.total_pull_requests += 1;
            repoAgg.pullRequests.push({
                id: pr.id,
                number: pr.number,
                title: pr.title,
                body: pr.body,
                state: pr.state,
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                closed_at: pr.closed_at,
                merged_at: pr.merged_at,
                user_id: pr.user_id,
                merged_by_id: pr.merged_by_id,
                repo_id: pr.repo_id,
                repo: pr.repo,
                user: getContributorInfo(pr.user_id),
                merged_by: pr.merged_by_id ? getContributorInfo(pr.merged_by_id) : null,
                additions: pr.additions,
                deletions: pr.deletions,
                changed_files: pr.changed_files,
                url: (orgLogin && repoName && pr.number) ? `https://github.com/${orgLogin}/${repoName}/pull/${pr.number}` : null
            });
            if (!repoAgg.contributors.has(login)) {
                repoAgg.contributors.set(login, {
                    login,
                    avatar_url,
                    commits: 0,
                    pull_requests: 0,
                    contributions: 0,
                    repositories: [],
                    repoNames: []
                });
            }
            const repoContributor = repoAgg.contributors.get(login)!;
            repoContributor.pull_requests += 1;
            repoContributor.contributions += 1;
        });
        total_pull_requests += 1;
        total_contributions += 1;
    });
    // Aggregate issues
    issuesApiData.forEach((issue: any) => {
        const repoName = issue.repo?.name || repoIdToName[issue.repo_id] || 'unknown-repo';
        const userId = issue.user_id;
        if (!userId) return;
        const { login, avatar_url } = getContributorInfo(userId);
        if (!contributorMap.has(login)) {
            contributorMap.set(login, {
                login,
                avatar_url,
                commits: 0,
                pull_requests: 0,
                contributions: 0,
                repositories: [],
                repoNames: []
            });
        }
        const contributor = contributorMap.get(login)!;
        let repoStats = contributor.repositories.find(r => r.name === repoName);
        if (!repoStats) {
            repoStats = {
                name: repoName,
                commits: 0,
                pull_requests: 0,
                contributions: 0,
                commit_timestamps: [],
                pr_timestamps: []
            };
            contributor.repositories.push(repoStats);
        }
        if (!perRepoMap.has(repoName)) {
            perRepoMap.set(repoName, {
                total_commits: 0,
                total_pull_requests: 0,
                total_issues: 0,
                contributors: new Map(),
                issues: [],
                commits: [],
                pullRequests: []
            });
        }
        const repoAgg = perRepoMap.get(repoName)!;
        repoAgg.total_issues += 1;
        repoAgg.issues.push({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            closed_at: issue.closed_at,
            comments_count: issue.comments_count,
            is_pull_request: issue.is_pull_request,
            milestone_title: issue.milestone_title,
            user: issue.user,
            assignees: issue.assignees || [],
            url: (orgLogin && repoName && issue.number) ? `https://github.com/${orgLogin}/${repoName}/issues/${issue.number}` : null
        });
        if (!repoAgg.contributors.has(login)) {
            repoAgg.contributors.set(login, {
                login,
                avatar_url,
                commits: 0,
                pull_requests: 0,
                contributions: 0,
                repositories: [],
                repoNames: []
            });
        }
        total_issues += 1;
    });
    // Convert perRepoMap contributors to arrays
    const perRepo: Record<string, any> = {};
    perRepoMap.forEach((value, key) => {
        perRepo[key] = {
            total_commits: value.total_commits,
            total_pull_requests: value.total_pull_requests,
            total_issues: value.total_issues,
            contributors: Array.from(value.contributors.values()),
            issues: value.issues,
            commits: value.commits,
            pullRequests: value.pullRequests
        };
    });
    // Final contributors array - only include contributors with commits or merged pull requests
    const contributors = Array.from(contributorMap.values())
        .filter(contributor => contributor.commits > 0 || contributor.pull_requests > 0);
    unique_count = contributors.length;
    return {
        total_commits,
        total_pull_requests,
        total_issues,
        total_contributions,
        unique_count,
        lastFetched,
        contributors,
        perRepo
    };
} 