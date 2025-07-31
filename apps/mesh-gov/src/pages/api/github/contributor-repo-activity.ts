import { NextApiRequest, NextApiResponse } from 'next';
import { getGitHubApiContext } from '../../../lib/githubApiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        if (!orgLogin) {
            return res.status(200).json({ contributorRepoActivity: [] });
        }

        const context = await getGitHubApiContext(orgLogin);
        if (!context) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (context.repoIds.length === 0) {
            return res.status(200).json({ contributorRepoActivity: [] });
        }

        // Use pre-fetched contributor repo activity data from context
        const contributorRepoActivity = context.contributorRepoActivityData;

        // Filter out entries with no activity and null contributor IDs
        const activeActivity = contributorRepoActivity.filter(
            (activity: any) => (activity.commits_in_repo > 0 || activity.prs_in_repo > 0) && activity.contributor_id !== null
        );

        return res.status(200).json({ contributorRepoActivity: activeActivity });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 