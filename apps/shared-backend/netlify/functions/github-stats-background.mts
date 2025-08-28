// Netlify Background Function (ESM)
// Receives new commits, PRs, and issues and upserts into Supabase

// @ts-nocheck
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// Expected environment variables in Netlify site settings
const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // Netlify will surface logs; we return a 500 on missing config
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

async function upsertContributor(login: string | null, avatarUrl: string | null) {
    if (!login) return null
    const { data, error } = await supabase
        .from('contributors')
        .upsert({ login, avatar_url: avatarUrl ?? null }, { onConflict: 'login' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function getRepo(org: string, repo: string) {
    // Legacy lookup by org login and repo name (used only if IDs are missing)
    const { data: orgs, error: orgError } = await supabase
        .from('github_orgs')
        .select('id, login')
        .eq('login', org)
        .limit(1)
    if (orgError) throw orgError
    if (!orgs || orgs.length === 0) return { orgId: null, repoId: null }
    const orgId = orgs[0].id as number

    const { data: repos, error: repoError } = await supabase
        .from('github_repos')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('name', repo)
        .limit(1)
    if (repoError) throw repoError
    if (!repos || repos.length === 0) return { orgId, repoId: null }
    return { orgId, repoId: repos[0].id as number }
}

async function ensureOrgAndRepo(orgLogin: string, repoName: string, orgInfo?: any, repoInfo?: any) {
    // If GitHub repo ID is provided, try to find by primary key first
    const githubOrgId = typeof orgInfo?.id === 'number' ? orgInfo.id : null
    const githubRepoId = typeof repoInfo?.id === 'number' ? repoInfo.id : null

    if (githubRepoId) {
        const { data: existingRepo, error: findRepoErr } = await supabase
            .from('github_repos')
            .select('id')
            .eq('id', githubRepoId)
            .single()
        if (findRepoErr && findRepoErr.code !== 'PGRST116') throw findRepoErr
        if (existingRepo?.id) {
            return { orgId: githubOrgId, repoId: existingRepo.id as number }
        }
    }

    // Upsert org with GitHub numeric ID and metadata
    let ensuredOrgId: number | null = null
    if (githubOrgId) {
        const orgRow = {
            id: githubOrgId,
            login: (orgInfo?.login as string) || orgLogin,
            name: orgInfo?.name ?? null,
            description: orgInfo?.description ?? null,
            avatar_url: orgInfo?.avatar_url ?? null,
            html_url: orgInfo?.html_url ?? null
        }
        const { data: upsertedOrg, error: upsertOrgErr } = await supabase
            .from('github_orgs')
            .upsert(orgRow, { onConflict: 'id' })
            .select('id')
            .single()
        if (upsertOrgErr) throw upsertOrgErr
        ensuredOrgId = upsertedOrg?.id ?? githubOrgId
    } else {
        // Fallback to legacy lookup by login if ID not provided
        const { orgId } = await getRepo(orgLogin, repoName)
        ensuredOrgId = orgId
    }

    if (!ensuredOrgId) return { orgId: null, repoId: null }

    // Upsert repo with GitHub numeric ID and metadata
    const repoRow: any = {
        id: githubRepoId ?? undefined,
        org_id: ensuredOrgId,
        name: (repoInfo?.name as string) || repoName,
        full_name: (repoInfo?.full_name as string) || `${orgInfo?.login || orgLogin}/${repoInfo?.name || repoName}`,
        description: repoInfo?.description ?? null,
        private: typeof repoInfo?.private === 'boolean' ? repoInfo.private : null,
        fork: typeof repoInfo?.fork === 'boolean' ? repoInfo.fork : null,
        html_url: repoInfo?.html_url ?? null
    }

    const { data: upsertedRepo, error: upsertRepoErr } = await supabase
        .from('github_repos')
        .upsert(repoRow, { onConflict: 'id' })
        .select('id')
        .single()
    if (upsertRepoErr) throw upsertRepoErr

    const resolvedRepoId = upsertedRepo?.id ?? githubRepoId ?? null
    return { orgId: ensuredOrgId, repoId: resolvedRepoId }
}

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        }
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) }
        }

        const body = event.body ? JSON.parse(event.body) : null
        if (!body) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing body' }) }
        }

        const org = (body.org as string) || ''
        const repo = (body.repo as string) || ''
        const orgInfo = body.orgInfo || null
        const repoInfo = body.repoInfo || null
        const commits = (body.commits as any[]) || []
        const pulls = (body.pulls as any[]) || []
        const issues = (body.issues as any[]) || []

        // Ensure org/repo exist in Supabase; create if missing using metadata from action
        const { repoId } = await ensureOrgAndRepo(org, repo, orgInfo, repoInfo)
        if (!repoId) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Repository not found in Supabase' }) }
        }

        // Upsert commits
        for (const commit of commits) {
            const authorLogin = commit.author?.login ?? null
            const committerLogin = commit.committer?.login ?? null
            const author = authorLogin ? await upsertContributor(authorLogin, commit.author?.avatar_url ?? null) : null
            const committer = committerLogin ? await upsertContributor(committerLogin, commit.committer?.avatar_url ?? null) : null

            const stats = commit.stats ?? null
            const files = Array.isArray(commit.files) ? commit.files : []
            const parents = Array.isArray(commit.parents) ? commit.parents : []
            const isMerge = parents.length > 1

            const { error } = await supabase
                .from('commits')
                .upsert({
                    sha: commit.sha,
                    repo_id: repoId,
                    author_id: author?.id ?? null,
                    committer_id: committer?.id ?? null,
                    message: commit.commit?.message ?? null,
                    date: commit.commit?.author?.date ?? null,
                    additions: stats ? stats.additions : null,
                    deletions: stats ? stats.deletions : null,
                    total_changes: stats ? stats.total : null,
                    files_changed: files.length || null,
                    is_merge: isMerge,
                    parent_shas: parents.map((p: any) => p.sha)
                }, { onConflict: 'sha' })
            if (error) throw error
        }

        // Upsert PRs and related entities
        for (const pr of pulls) {
            const details = pr.details
            const prCommits = pr.commits || []
            const userLogin = details?.user?.login ?? null
            const mergedByLogin = details?.merged_by?.login ?? null
            const user = userLogin ? await upsertContributor(userLogin, details?.user?.avatar_url ?? null) : null
            const mergedBy = mergedByLogin ? await upsertContributor(mergedByLogin, details?.merged_by?.avatar_url ?? null) : null

            const { data: prRow, error: upsertPrErr } = await supabase
                .from('pull_requests')
                .upsert({
                    number: details.number,
                    repo_id: repoId,
                    user_id: user?.id ?? null,
                    merged_by_id: mergedBy?.id ?? null,
                    title: details.title,
                    body: details.body ?? null,
                    state: details.state,
                    created_at: details.created_at,
                    updated_at: details.updated_at,
                    closed_at: details.closed_at,
                    merged_at: details.merged_at,
                    additions: details.additions ?? null,
                    deletions: details.deletions ?? null,
                    changed_files: details.changed_files ?? null,
                    commits_count: details.commits ?? null,
                }, { onConflict: 'repo_id,number' })
                .select()
                .single()
            if (upsertPrErr) throw upsertPrErr

            const prId = prRow.id

            // requested reviewers
            const reviewers = Array.isArray(details?.requested_reviewers) ? details.requested_reviewers : []
            for (const reviewer of reviewers) {
                const reviewerLogin = reviewer?.login ?? null
                if (!reviewerLogin) continue
                const reviewerRow = await upsertContributor(reviewerLogin, reviewer?.avatar_url ?? null)
                const { error } = await supabase
                    .from('pr_reviewers')
                    .upsert({ pr_id: prId, reviewer_id: reviewerRow?.id }, { onConflict: 'pr_id,reviewer_id' })
                    .select()
                    .single()
                if (error) throw error
            }

            // assignees
            const assignees = Array.isArray(details?.assignees) ? details.assignees : []
            for (const assignee of assignees) {
                const assigneeLogin = assignee?.login ?? null
                if (!assigneeLogin) continue
                const assigneeRow = await upsertContributor(assigneeLogin, assignee?.avatar_url ?? null)
                const { error } = await supabase
                    .from('pr_assignees')
                    .upsert({ pr_id: prId, assignee_id: assigneeRow?.id }, { onConflict: 'pr_id,assignee_id' })
                    .select()
                    .single()
                if (error) throw error
            }

            // labels
            const labels = Array.isArray(details?.labels) ? details.labels : []
            for (const label of labels) {
                const { error } = await supabase
                    .from('pr_labels')
                    .upsert({ pr_id: prId, label_name: label?.name }, { onConflict: 'pr_id,label_name' })
                    .select()
                    .single()
                if (error) throw error
            }

            // PR commits
            for (const prCommit of prCommits) {
                const { error } = await supabase
                    .from('pr_commits')
                    .upsert({ pr_id: prId, commit_sha: prCommit.sha }, { onConflict: 'pr_id,commit_sha' })
                    .select()
                    .single()
                if (error) throw error
            }
        }

        // Upsert Issues and related entities
        for (const issue of issues) {
            if (issue.pull_request) continue
            const userLogin = issue.user?.login ?? null
            const user = userLogin ? await upsertContributor(userLogin, issue.user?.avatar_url ?? null) : null

            const { data: issueRow, error: upsertIssueErr } = await supabase
                .from('issues')
                .upsert({
                    number: issue.number,
                    repo_id: repoId,
                    user_id: user?.id ?? null,
                    title: issue.title,
                    body: issue.body ?? null,
                    state: issue.state,
                    created_at: issue.created_at,
                    updated_at: issue.updated_at,
                    closed_at: issue.closed_at,
                    comments_count: issue.comments ?? null,
                    is_pull_request: false,
                    milestone_title: issue.milestone ? issue.milestone.title : null
                }, { onConflict: 'repo_id,number' })
                .select()
                .single()
            if (upsertIssueErr) throw upsertIssueErr

            const issueId = issueRow.id

            const assignees = Array.isArray(issue.assignees) ? issue.assignees : []
            for (const assignee of assignees) {
                const assigneeLogin = assignee?.login ?? null
                if (!assigneeLogin) continue
                const assigneeRow = await upsertContributor(assigneeLogin, assignee?.avatar_url ?? null)
                const { error } = await supabase
                    .from('issue_assignees')
                    .upsert({ issue_id: issueId, assignee_id: assigneeRow?.id }, { onConflict: 'issue_id,assignee_id' })
                    .select()
                    .single()
                if (error) throw error
            }

            const labels = Array.isArray(issue.labels) ? issue.labels : []
            for (const label of labels) {
                const { error } = await supabase
                    .from('issue_labels')
                    .upsert({ issue_id: issueId, label_name: label?.name }, { onConflict: 'issue_id,label_name' })
                    .select()
                    .single()
                if (error) throw error
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        }
    } catch (err: any) {
        const errorMessage = err?.message || String(err)
        const errorCode = err?.code || err?.status || undefined
        console.error('github-stats-background error:', errorMessage)
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: 'Internal Server Error', details: errorMessage, code: errorCode })
        }
    }
}


