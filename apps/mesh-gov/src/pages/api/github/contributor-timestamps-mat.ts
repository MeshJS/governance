import { NextApiRequest, NextApiResponse } from 'next';
import { getGitHubApiContext } from '../../../lib/githubApiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        if (!orgLogin) {
            return res.status(200).json({ contributorTimestamps: {} });
        }

        const context = await getGitHubApiContext(orgLogin);
        if (!context) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (context.contributorIds.length === 0) {
            return res.status(200).json({ contributorTimestamps: {} });
        }

        // Use pre-fetched yearly activity data from context (arrays per row)
        const yearlyActivityData = context.contributorTimestampsData;

        // Build the timestamps data structure
        const contributorTimestamps: Record<string, Record<string, { commit_timestamps: string[], pr_timestamps: string[] }>> = {};

        // Process yearly activity rows and merge arrays across years
        yearlyActivityData.forEach((row: any) => {
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

        return res.status(200).json({ contributorTimestamps });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 