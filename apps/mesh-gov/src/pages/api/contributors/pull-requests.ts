import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        // Fetch all pull requests with user, merged_by, repo, reviewers, and assignees using explicit foreign key relationships
        const { data: pullRequests, error } = await supabase
            .from('pull_requests')
            .select(`*, user:user_id(*), merged_by:merged_by_id(*), repo:repo_id(*), reviewers:pr_reviewers(*, reviewer:reviewer_id(*)), assignees:pr_assignees(*, assignee:assignee_id(*))`);
        if (error) throw new Error(error.message);
        return res.status(200).json({ pullRequests });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
