import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        // Fetch all issues with user, repo, and assignees using explicit foreign key relationships
        const { data: issues, error } = await supabase
            .from('issues')
            .select(`*, user:user_id(*), repo:repo_id(*), assignees:issue_assignees(*, assignee:assignee_id(*))`);
        if (error) throw new Error(error.message);
        return res.status(200).json({ issues });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
