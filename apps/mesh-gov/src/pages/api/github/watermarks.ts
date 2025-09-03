import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

type WatermarksResponse = {
    repoId: number | null;
    latestCommitAt: string | null;
    latestPullUpdatedAt: string | null;
    latestIssueUpdatedAt: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const orgLogin = (req.query.org as string | undefined)?.trim();
        const repoName = (req.query.repo as string | undefined)?.trim();

        if (!orgLogin || !repoName) {
            return res.status(400).json({ error: 'Missing required query params: org, repo' });
        }

        // Find organization id by login
        const { data: orgs, error: orgError } = await supabase
            .from('github_orgs')
            .select('id')
            .eq('login', orgLogin)
            .limit(1);

        if (orgError) throw new Error(orgError.message);
        if (!orgs || orgs.length === 0) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const orgId = orgs[0].id as number;

        // Find repository id by org_id + name
        const { data: repos, error: repoError } = await supabase
            .from('github_repos')
            .select('id, name')
            .eq('org_id', orgId)
            .eq('name', repoName)
            .limit(1);

        if (repoError) throw new Error(repoError.message);
        if (!repos || repos.length === 0) {
            const empty: WatermarksResponse = {
                repoId: null,
                latestCommitAt: null,
                latestPullUpdatedAt: null,
                latestIssueUpdatedAt: null,
            };
            return res.status(200).json(empty);
        }

        const repoId = repos[0].id as number;

        // Get latest commit date
        const [{ data: latestCommit, error: latestCommitError }, { data: latestPr, error: latestPrError }, { data: latestIssue, error: latestIssueError }] = await Promise.all([
            supabase
                .from('commits')
                .select('date')
                .eq('repo_id', repoId)
                .not('date', 'is', null)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from('pull_requests')
                .select('updated_at')
                .eq('repo_id', repoId)
                .not('updated_at', 'is', null)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            supabase
                .from('issues')
                .select('updated_at')
                .eq('repo_id', repoId)
                .eq('is_pull_request', false)
                .not('updated_at', 'is', null)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
        ]);

        if (latestCommitError) throw new Error(latestCommitError.message);
        if (latestPrError) throw new Error(latestPrError.message);
        if (latestIssueError) throw new Error(latestIssueError.message);

        const payload: WatermarksResponse = {
            repoId,
            latestCommitAt: (latestCommit?.date as string | null) ?? null,
            latestPullUpdatedAt: (latestPr?.updated_at as string | null) ?? null,
            latestIssueUpdatedAt: (latestIssue?.updated_at as string | null) ?? null,
        };

        return res.status(200).json(payload);
    } catch (err: any) {
        console.error('watermarks API error:', err?.message || err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


