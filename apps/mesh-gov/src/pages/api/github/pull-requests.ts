import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        let repoIds: number[] | undefined = undefined;
        if (orgLogin) {
            // Get org id
            const { data: orgs, error: orgError } = await supabase
                .from('github_orgs')
                .select('id')
                .eq('login', orgLogin);
            if (orgError) throw new Error(orgError.message);
            if (!orgs || orgs.length === 0) {
                return res.status(404).json({ error: 'Organization not found' });
            }
            const orgId = orgs[0].id;
            // Get repo ids for this org
            const { data: repos, error: repoError } = await supabase
                .from('github_repos')
                .select('id')
                .eq('org_id', orgId);
            if (repoError) throw new Error(repoError.message);
            repoIds = repos?.map(r => r.id) ?? [];
            if (repoIds.length === 0) {
                return res.status(200).json({ pullRequests: [] });
            }
        }
        let query = supabase
            .from('pull_requests')
            .select(`*, user:user_id(*), merged_by:merged_by_id(*), repo:repo_id(*), reviewers:pr_reviewers(*, reviewer:reviewer_id(*)), assignees:pr_assignees(*, assignee:assignee_id(*))`);
        if (repoIds) {
            query = query.in('repo_id', repoIds);
        }
        const { data: pullRequests, error } = await query;
        if (error) throw new Error(error.message);
        return res.status(200).json({ pullRequests });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 