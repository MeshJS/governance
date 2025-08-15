import { NextApiRequest, NextApiResponse } from 'next';
import { getOrgContributorStats } from '../../../lib/githubApiUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        if (!orgLogin) {
            res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
            return res.status(200).json({
                total_commits: 0,
                total_pull_requests: 0,
                total_issues: 0,
                total_contributions: 0,
                unique_count: 0,
                lastFetched: Date.now(),
                contributors: [],
                perRepo: {}
            });
        }

        const contributorStats = await getOrgContributorStats(orgLogin);

        // Helpful cache headers for edge/CDN layers
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

        return res.status(200).json(contributorStats);
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

