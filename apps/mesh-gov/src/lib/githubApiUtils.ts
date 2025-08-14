import { supabase } from './supabase';

export interface GitHubApiContext {
    orgId: number;
    repoIds: number[];
    contributorIds: number[];
    contributorIdToLogin: Map<number, string>;
    repoIdToName: Map<number, string>;
    // Pre-fetched materialized view data
    contributorSummaryData: any[];
    contributorRepoActivityData: any[];
    contributorTimestampsData: any[];
}

export async function getGitHubApiContext(orgLogin: string): Promise<GitHubApiContext | null> {
    try {
        // Get org id
        const { data: orgs, error: orgError } = await supabase
            .from('github_orgs')
            .select('id')
            .eq('login', orgLogin);

        if (orgError) throw new Error(orgError.message);
        if (!orgs || orgs.length === 0) {
            return null;
        }

        const orgId = orgs[0].id;

        // Get repo ids and names for this org
        const { data: repos, error: repoError } = await supabase
            .from('github_repos')
            .select('id, name')
            .eq('org_id', orgId);

        if (repoError) throw new Error(repoError.message);
        const repoIds = repos?.map(r => r.id) ?? [];
        const repoIdToName = new Map<number, string>();
        repos?.forEach(repo => {
            repoIdToName.set(repo.id, repo.name);
        });

        if (repoIds.length === 0) {
            return {
                orgId,
                repoIds: [],
                contributorIds: [],
                contributorIdToLogin: new Map(),
                repoIdToName: new Map(),
                contributorSummaryData: [],
                contributorRepoActivityData: [],
                contributorTimestampsData: []
            };
        }

        // Get contributor yearly activity data (single source of truth)
        const yearlyActivity = await supabase
            .from('contributor_activity_yearly_mat')
            .select('contributor_id, login, repo_id, repo_name, commit_count, pr_count, commit_timestamps, pr_timestamps')
            .in('repo_id', repoIds);

        if (yearlyActivity.error) throw new Error(yearlyActivity.error.message);

        // Extract contributor IDs from yearly activity data
        const contributorIds = new Set<number>();
        (yearlyActivity.data || []).forEach(row => {
            if (row.contributor_id) contributorIds.add(row.contributor_id);
        });

        if (contributorIds.size === 0) {
            return {
                orgId,
                repoIds,
                contributorIds: [],
                contributorIdToLogin: new Map(),
                repoIdToName,
                contributorSummaryData: [],
                contributorRepoActivityData: [],
                contributorTimestampsData: []
            };
        }

        // Build contributor ID to login mapping from yearly activity data
        const contributorIdToLogin = new Map<number, string>();
        (yearlyActivity.data || []).forEach(row => {
            if (contributorIds.has(row.contributor_id)) {
                contributorIdToLogin.set(row.contributor_id, row.login);
            }
        });

        // Fetch avatar URLs for contributors (needed for UI) from contributors table
        const contributorsInfo = contributorIds.size > 0
            ? await supabase
                .from('contributors')
                .select('id, login, avatar_url')
                .in('id', Array.from(contributorIds))
            : { data: [], error: null } as any;
        if (contributorsInfo.error) throw new Error(contributorsInfo.error.message);
        const contributorIdToAvatar = new Map<number, string>();
        (contributorsInfo.data || []).forEach((c: any) => {
            contributorIdToAvatar.set(c.id, c.avatar_url || '');
            if (!contributorIdToLogin.has(c.id) && c.login) {
                contributorIdToLogin.set(c.id, c.login);
            }
        });

        // Aggregate summary data (commits_count, prs_count, repos_count) from yearly activity
        const summaryByContributor = new Map<number, { contributor_id: number; login: string; avatar_url: string; commits_count: number; prs_count: number; repos_count: number }>();
        const repoSetsByContributor = new Map<number, Set<number>>();
        (yearlyActivity.data || []).forEach(row => {
            const contributorId = row.contributor_id as number;
            const login = contributorIdToLogin.get(contributorId) || `unknown-${contributorId}`;
            const avatar_url = contributorIdToAvatar.get(contributorId) || '';
            const commits = row.commit_count || 0;
            const prs = row.pr_count || 0;
            if (!summaryByContributor.has(contributorId)) {
                summaryByContributor.set(contributorId, {
                    contributor_id: contributorId,
                    login,
                    avatar_url,
                    commits_count: 0,
                    prs_count: 0,
                    repos_count: 0
                });
                repoSetsByContributor.set(contributorId, new Set<number>());
            }
            const summary = summaryByContributor.get(contributorId)!;
            summary.commits_count += commits;
            summary.prs_count += prs;
            if (row.repo_id != null) {
                repoSetsByContributor.get(contributorId)!.add(row.repo_id as number);
            }
        });
        // Finalize repos_count
        summaryByContributor.forEach((summary, contributorId) => {
            summary.repos_count = repoSetsByContributor.get(contributorId)?.size || 0;
        });
        const filteredContributorSummary = Array.from(summaryByContributor.values());

        // Aggregate repo activity per contributor/repo from yearly activity
        const activityByContributorRepo = new Map<string, { contributor_id: number; repo_id: number; repo_name: string; commits_in_repo: number; prs_in_repo: number }>();
        (yearlyActivity.data || []).forEach(row => {
            const contributorId = row.contributor_id as number;
            const repoId = row.repo_id as number;
            const key = `${contributorId}:${repoId}`;
            if (!activityByContributorRepo.has(key)) {
                activityByContributorRepo.set(key, {
                    contributor_id: contributorId,
                    repo_id: repoId,
                    repo_name: row.repo_name,
                    commits_in_repo: 0,
                    prs_in_repo: 0
                });
            }
            const agg = activityByContributorRepo.get(key)!;
            agg.commits_in_repo += row.commit_count || 0;
            agg.prs_in_repo += row.pr_count || 0;
        });
        const filteredContributorRepoActivity = Array.from(activityByContributorRepo.values());

        // Filter yearly activity data to only include contributors for this org (already scoped by repoIds)
        const filteredContributorTimestamps = (yearlyActivity.data || []).filter(
            activity => contributorIds.has(activity.contributor_id)
        );

        return {
            orgId,
            repoIds,
            contributorIds: Array.from(contributorIds),
            contributorIdToLogin,
            repoIdToName,
            contributorSummaryData: filteredContributorSummary,
            contributorRepoActivityData: filteredContributorRepoActivity,
            contributorTimestampsData: filteredContributorTimestamps
        };
    } catch (err) {
        console.error('Error getting GitHub API context:', err);
        return null;
    }
}
