import { Contributor, ContributorRepository, ContributorStats } from '../types';

/**
 * Aggregates contributor stats using the new materialized view APIs.
 * This function uses the more efficient materialized views instead of individual API calls.
 * @param contributorSummaryData Array of contributor summaries (from /api/github/contributor-summary)
 * @param contributorRepoActivityData Array of repo activity (from /api/github/contributor-repo-activity)
 * @param contributorTimestampsData Object with timestamps (from /api/github/contributor-timestamps-mat)
 * @returns ContributorStats object with the same structure as the original function
 */
export function aggregateMaterializedViewContributorStats({
    contributorSummaryData = [],
    contributorRepoActivityData = [],
    contributorTimestampsData = {}
}: {
    contributorSummaryData: any[];
    contributorRepoActivityData: any[];
    contributorTimestampsData: Record<string, Record<string, { commit_timestamps: string[], pr_timestamps: string[] }>>;
}) {
    // Build contributorId -> contributor info map from summary data (which includes login and avatar_url)
    const contributorIdToInfo: Record<number, any> = {};
    contributorSummaryData.forEach((contributor: any) => {
        contributorIdToInfo[contributor.contributor_id] = {
            login: contributor.login,
            avatar_url: contributor.avatar_url
        };
    });

    // Helper: get login/avatar for a contributorId
    function getContributorInfo(id: number) {
        return contributorIdToInfo[id] || { login: `unknown-${id}`, avatar_url: '' };
    }

    // Per-contributor stats: login -> Contributor
    const contributorMap = new Map<string, Contributor>();

    // Per-repo stats: repoName -> { total_commits, total_pull_requests, total_issues, contributors: Map<login, Contributor> }
    const perRepoMap = new Map<string, {
        total_commits: number;
        total_pull_requests: number;
        total_issues: number;
        contributors: Map<string, Contributor>;
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

    // Process contributor summary data to initialize contributors
    contributorSummaryData.forEach((summary: any) => {
        const contributorId = summary.contributor_id;
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
        contributor.commits = summary.commits_count || 0;
        contributor.pull_requests = summary.prs_count || 0;
        contributor.contributions = contributor.commits + contributor.pull_requests;

        total_commits += contributor.commits;
        total_pull_requests += contributor.pull_requests;
        total_contributions += contributor.contributions;
    });

    // Process contributor repo activity data to populate repository details
    contributorRepoActivityData.forEach((activity: any) => {
        const contributorId = activity.contributor_id;
        const repoName = activity.repo_name; // Use repo_name directly from materialized view
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

        // Add repository to contributor
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

        repoStats.commits = activity.commits_in_repo || 0;
        repoStats.pull_requests = activity.prs_in_repo || 0;
        repoStats.contributions = repoStats.commits + repoStats.pull_requests;

        // Add repo name to repoNames array if not already present
        if (!contributor.repoNames.includes(repoName)) {
            contributor.repoNames.push(repoName);
        }

        // Initialize per-repo stats
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
        repoAgg.total_commits += repoStats.commits;
        repoAgg.total_pull_requests += repoStats.pull_requests;

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
        repoContributor.commits += repoStats.commits;
        repoContributor.pull_requests += repoStats.pull_requests;
        repoContributor.contributions += repoStats.contributions;
    });

    // Process timestamps data to populate commit_timestamps and pr_timestamps
    Object.entries(contributorTimestampsData).forEach(([contributorLogin, repoData]) => {
        const contributor = contributorMap.get(contributorLogin);
        if (!contributor) return;

        Object.entries(repoData).forEach(([repoName, timestamps]) => {
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

            repoStats.commit_timestamps = timestamps.commit_timestamps || [];
            repoStats.pr_timestamps = timestamps.pr_timestamps || [];
        });
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
