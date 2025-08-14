import { NextApiRequest, NextApiResponse } from 'next';
import { getGitHubApiContext } from '../../../lib/githubApiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        if (!orgLogin) {
            return res.status(200).json({
                contributorSummary: [],
                contributorRepoActivity: [],
                contributorTimestamps: {}
            });
        }

        const context = await getGitHubApiContext(orgLogin);
        if (!context) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (context.repoIds.length === 0 || context.contributorIds.length === 0) {
            return res.status(200).json({
                contributorSummary: [],
                contributorRepoActivity: [],
                contributorTimestamps: {}
            });
        }

        // Prefetched datasets from context
        const contributorSummary = context.contributorSummaryData;
        const contributorRepoActivity = context.contributorRepoActivityData;
        const yearlyActivityData = context.contributorTimestampsData;

        // Filter out zero-activity entries for summary
        const activeContributors = (contributorSummary || []).filter(
            (c: any) => c.commits_count > 0 || c.prs_count > 0
        );

        // Filter out zero-activity entries and null contributor IDs for repo activity
        const activeActivity = (contributorRepoActivity || []).filter(
            (activity: any) => (activity.commits_in_repo > 0 || activity.prs_in_repo > 0) && activity.contributor_id !== null
        );

        // Build merged timestamps keyed by contributor login and repo name
        const contributorTimestamps: Record<string, Record<string, { commit_timestamps: string[]; pr_timestamps: string[] }>> = {};
        (yearlyActivityData || []).forEach((row: any) => {
            const contributorLogin = context.contributorIdToLogin.get(row.contributor_id);
            const repoName = row.repo_name;
            if (!contributorLogin || !repoName) return;
            if (!contributorTimestamps[contributorLogin]) {
                contributorTimestamps[contributorLogin] = {};
            }
            if (!contributorTimestamps[contributorLogin][repoName]) {
                contributorTimestamps[contributorLogin][repoName] = {
                    commit_timestamps: [],
                    pr_timestamps: []
                };
            }
            const commitTimestamps = Array.isArray(row.commit_timestamps) ? row.commit_timestamps : [];
            const prTimestamps = Array.isArray(row.pr_timestamps) ? row.pr_timestamps : [];
            contributorTimestamps[contributorLogin][repoName].commit_timestamps.push(...commitTimestamps);
            contributorTimestamps[contributorLogin][repoName].pr_timestamps.push(...prTimestamps);
        });

        // Helpful cache headers for edge/CDN layers
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

        return res.status(200).json({
            contributorSummary: activeContributors,
            contributorRepoActivity: activeActivity,
            contributorTimestamps
        });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

