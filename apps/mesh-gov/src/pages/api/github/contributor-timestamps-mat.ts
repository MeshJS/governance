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

        // Use pre-fetched timestamps data from context
        const timestampsData = context.contributorTimestampsData;

        // Build the timestamps data structure
        const contributorTimestamps: Record<string, Record<string, { commit_timestamps: string[], pr_timestamps: string[] }>> = {};

        // Process timestamps data
        timestampsData.forEach((activity: any) => {
            const contributorLogin = context.contributorIdToLogin.get(activity.contributor_id);
            const repoName = activity.repo_name;

            if (!contributorLogin || !repoName || !activity.timestamp) return;

            if (!contributorTimestamps[contributorLogin]) {
                contributorTimestamps[contributorLogin] = {};
            }
            if (!contributorTimestamps[contributorLogin][repoName]) {
                contributorTimestamps[contributorLogin][repoName] = {
                    commit_timestamps: [],
                    pr_timestamps: []
                };
            }

            // Add timestamp to appropriate array based on activity type
            if (activity.activity_type === 'commit') {
                contributorTimestamps[contributorLogin][repoName].commit_timestamps.push(activity.timestamp);
            } else if (activity.activity_type === 'pr') {
                contributorTimestamps[contributorLogin][repoName].pr_timestamps.push(activity.timestamp);
            }
        });

        return res.status(200).json({ contributorTimestamps });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 