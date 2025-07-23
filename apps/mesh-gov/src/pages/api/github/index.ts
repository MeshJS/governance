import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const orgLogin = req.query.org as string | undefined;
        if (!orgLogin) {
            return res.status(200).json({ contributors: [] });
        }
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
        const repoIds = repos?.map(r => r.id) ?? [];
        if (repoIds.length === 0) {
            return res.status(200).json({ contributors: [] });
        }
        // Get contributors from commits, pull_requests, and issues
        const [commits, pullRequests, issues] = await Promise.all([
            supabase.from('commits').select('author_id').in('repo_id', repoIds), // Only author_id
            supabase.from('pull_requests').select('user_id, merged_by_id').in('repo_id', repoIds),
            supabase.from('issues').select('user_id').in('repo_id', repoIds),
        ]);
        const contributorIds = new Set<number>();
        (commits.data || []).forEach(row => {
            if (row.author_id) contributorIds.add(row.author_id);
        });
        (pullRequests.data || []).forEach(row => {
            if (row.user_id) contributorIds.add(row.user_id);
            if (row.merged_by_id) contributorIds.add(row.merged_by_id);
        });
        (issues.data || []).forEach(row => {
            if (row.user_id) contributorIds.add(row.user_id);
        });
        if (contributorIds.size === 0) {
            return res.status(200).json({ contributors: [] });
        }
        // Fetch contributor details
        const { data: contributors, error: contribError } = await supabase
            .from('contributors')
            .select('*')
            .in('id', Array.from(contributorIds));
        if (contribError) throw new Error(contribError.message);
        return res.status(200).json({ contributors });
    } catch (err) {
        console.error('API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
} 