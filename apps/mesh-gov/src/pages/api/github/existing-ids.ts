import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

type ExistingIdsResponse = {
    repoId: number | null
    commitShas: string[]
    prNumbers: number[]
    issueNumbers: number[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const orgLogin = (req.query.org as string | undefined)?.trim()
        const repoName = (req.query.repo as string | undefined)?.trim()

        if (!orgLogin || !repoName) {
            return res.status(400).json({ error: 'Missing required query params: org, repo' })
        }

        // Get org id
        const { data: orgs, error: orgError } = await supabase
            .from('github_orgs')
            .select('id')
            .eq('login', orgLogin)
            .limit(1)

        if (orgError) throw new Error(orgError.message)
        if (!orgs || orgs.length === 0) {
            return res.status(404).json({ error: 'Organization not found' })
        }

        const orgId = orgs[0].id as number

        // Get repo id by org_id + name
        const { data: repos, error: repoError } = await supabase
            .from('github_repos')
            .select('id, name')
            .eq('org_id', orgId)
            .eq('name', repoName)
            .limit(1)

        if (repoError) throw new Error(repoError.message)
        if (!repos || repos.length === 0) {
            const empty: ExistingIdsResponse = { repoId: null, commitShas: [], prNumbers: [], issueNumbers: [] }
            return res.status(200).json(empty)
        }

        const repoId = repos[0].id as number

        // Fetch existing commit SHAs, PR numbers, Issue numbers in parallel
        const [commitsResp, prsResp, issuesResp] = await Promise.all([
            supabase.from('commits').select('sha').eq('repo_id', repoId),
            supabase.from('pull_requests').select('number').eq('repo_id', repoId),
            supabase.from('issues').select('number').eq('repo_id', repoId),
        ])

        if (commitsResp.error) throw new Error(commitsResp.error.message)
        if (prsResp.error) throw new Error(prsResp.error.message)
        if (issuesResp.error) throw new Error(issuesResp.error.message)

        const commitShas = (commitsResp.data ?? []).map((c: any) => c.sha as string)
        const prNumbers = (prsResp.data ?? []).map((p: any) => p.number as number)
        const issueNumbers = (issuesResp.data ?? []).map((i: any) => i.number as number)

        const payload: ExistingIdsResponse = { repoId, commitShas, prNumbers, issueNumbers }
        return res.status(200).json(payload)
    } catch (err: any) {
        console.error('existing-ids API error:', err?.message || err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}


