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

        // Get all materialized view data in parallel for this org's repos
        const [contributorRepoActivity, contributorSummary, contributorTimestamps] = await Promise.all([
            // Get contributor repo activity data
            supabase
                .from('contributor_repo_activity_mat')
                .select('*')
                .in('repo_id', repoIds),

            // Get contributor summary data
            supabase
                .from('contributor_summary_mat')
                .select('*'),

            // Get contributor yearly activity data (includes aggregated timestamps arrays)
            supabase
                .from('contributor_activity_yearly_mat')
                .select('contributor_id, repo_id, repo_name, commit_timestamps, pr_timestamps')
                .in('repo_id', repoIds)
        ]);

        if (contributorRepoActivity.error) throw new Error(contributorRepoActivity.error.message);
        if (contributorSummary.error) throw new Error(contributorSummary.error.message);
        if (contributorTimestamps.error) throw new Error(contributorTimestamps.error.message);

        // Extract contributor IDs from repo activity data
        const contributorIds = new Set<number>();
        (contributorRepoActivity.data || []).forEach(row => {
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

        // Build contributor ID to login mapping from summary data (which includes login and avatar_url)
        const contributorIdToLogin = new Map<number, string>();
        (contributorSummary.data || []).forEach(contributor => {
            if (contributorIds.has(contributor.contributor_id)) {
                contributorIdToLogin.set(contributor.contributor_id, contributor.login);
            }
        });

        // Filter summary data to only include contributors for this org
        const filteredContributorSummary = (contributorSummary.data || []).filter(
            contributor => contributorIds.has(contributor.contributor_id)
        );

        // Filter repo activity data to only include contributors for this org
        const filteredContributorRepoActivity = (contributorRepoActivity.data || []).filter(
            activity => contributorIds.has(activity.contributor_id)
        );

        // Filter yearly activity data to only include contributors for this org
        const filteredContributorTimestamps = (contributorTimestamps.data || []).filter(
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
