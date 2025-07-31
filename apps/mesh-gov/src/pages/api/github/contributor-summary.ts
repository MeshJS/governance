import { NextApiRequest, NextApiResponse } from 'next';
import { getGitHubApiContext } from '../../../lib/githubApiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        if (!orgLogin) {
            return res.status(200).json({ contributorSummary: [] });
        }

        const context = await getGitHubApiContext(orgLogin);
        if (!context) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        if (context.contributorIds.length === 0) {
            return res.status(200).json({ contributorSummary: [] });
        }

        // Use pre-fetched contributor summary data from context
        const contributorSummary = context.contributorSummaryData;

        // Filter out contributors with no activity
        const activeContributors = contributorSummary.filter(
            (contributor: any) => contributor.commits_count > 0 || contributor.prs_count > 0
        );

        return res.status(200).json({ contributorSummary: activeContributors });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 