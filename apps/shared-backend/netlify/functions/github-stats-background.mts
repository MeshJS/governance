// netlify/functions/github-stats-background.mts
import type { Context } from '@netlify/functions'
import { config as dotenv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

dotenv()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Retry helper for GitHub API calls
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 1000): Promise<T> {
    let attempt = 0
    let delay = initialDelay
    while (attempt < maxRetries) {
        try {
            return await fn()
        } catch (error: any) {
            const status = error.response?.status
            // Only retry on 403, 429, or 5xx errors
            if ([403, 429].includes(status) || (status >= 500 && status < 600)) {
                attempt++
                if (attempt === maxRetries) throw error
                console.warn(`Retrying after error ${status} (attempt ${attempt}/${maxRetries})...`)
                await new Promise(res => setTimeout(res, delay))
                delay *= 2 // Exponential backoff
            } else {
                throw error
            }
        }
    }
    throw new Error('Max retries exceeded')
}

// Database operations
async function upsertGitHubOrg(orgData: any) {
    const { data, error } = await supabase
        .from('github_orgs')
        .upsert({
            id: orgData.id,
            login: orgData.login,
            name: orgData.name,
            description: orgData.description,
            avatar_url: orgData.avatar_url,
            html_url: orgData.html_url
        }, { onConflict: 'id' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertGitHubRepo(repoData: any) {
    const { data, error } = await supabase
        .from('github_repos')
        .upsert({
            id: repoData.id,
            org_id: repoData.org_id,
            name: repoData.name,
            full_name: repoData.full_name,
            description: repoData.description,
            private: repoData.private,
            fork: repoData.fork,
            html_url: repoData.html_url
        }, { onConflict: 'id' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertContributor(contributorData: any) {
    const { data, error } = await supabase
        .from('contributors')
        .upsert(contributorData, { onConflict: 'login' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertCommit(commitData: any) {
    const { data, error } = await supabase
        .from('commits')
        .upsert(commitData, { onConflict: 'sha' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertPullRequest(prData: any) {
    const { data, error } = await supabase
        .from('pull_requests')
        .upsert(prData, { onConflict: 'repo_id,number' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function getPullRequestByNumber(repoId: number, number: number) {
    const { data, error } = await supabase
        .from('pull_requests')
        .select('*')
        .eq('repo_id', repoId)
        .eq('number', number)
        .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
}

async function upsertPRReviewer(prReviewerData: any) {
    const { data, error } = await supabase
        .from('pr_reviewers')
        .upsert(prReviewerData, { onConflict: 'pr_id,reviewer_id' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertPRAssignee(prAssigneeData: any) {
    const { data, error } = await supabase
        .from('pr_assignees')
        .upsert(prAssigneeData, { onConflict: 'pr_id,assignee_id' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertPRLabel(prLabelData: any) {
    const { data, error } = await supabase
        .from('pr_labels')
        .upsert(prLabelData, { onConflict: 'pr_id,label_name' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertPRCommit(prCommitData: any) {
    const { data, error } = await supabase
        .from('pr_commits')
        .upsert(prCommitData, { onConflict: 'pr_id,commit_sha' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertIssue(issueData: any) {
    const { data, error } = await supabase
        .from('issues')
        .upsert(issueData, { onConflict: 'repo_id,number' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function getIssueByNumber(repoId: number, number: number) {
    const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('repo_id', repoId)
        .eq('number', number)
        .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
}

async function upsertIssueAssignee(issueAssigneeData: any) {
    const { data, error } = await supabase
        .from('issue_assignees')
        .upsert(issueAssigneeData, { onConflict: 'issue_id,assignee_id' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function upsertIssueLabel(issueLabelData: any) {
    const { data, error } = await supabase
        .from('issue_labels')
        .upsert(issueLabelData, { onConflict: 'issue_id,label_name' })
        .select()
        .single()
    if (error) throw error
    return data
}

async function getExistingCommitShas(repoId: number) {
    const { data, error } = await supabase
        .from('commits')
        .select('sha')
        .eq('repo_id', repoId)
    if (error) throw error
    return new Set(data.map(commit => commit.sha))
}

async function getExistingPRNumbers(repoId: number) {
    const { data, error } = await supabase
        .from('pull_requests')
        .select('number')
        .eq('repo_id', repoId)
    if (error) throw error
    return new Set(data.map(pr => pr.number))
}

async function getExistingIssueNumbers(repoId: number) {
    const { data, error } = await supabase
        .from('issues')
        .select('number')
        .eq('repo_id', repoId)
    if (error) throw error
    return new Set(data.map(issue => issue.number))
}

async function fetchAndSaveContributorsAndActivity(githubToken: string, orgName: string, repoName: string) {
    console.log(`\nFetching and saving repository contributors, commits, and pull requests for ${orgName}/${repoName}...`)

    // Get specific repository
    let repo: any
    try {
        console.log(`Fetching repository ${orgName}/${repoName}...`)
        const repoResponse = await retryWithBackoff(() =>
            axios.get(`https://api.github.com/repos/${orgName}/${repoName}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${githubToken}`
                }
            })
        )
        repo = repoResponse.data
    } catch (error: any) {
        console.error(`Error fetching repository ${orgName}/${repoName}:`, error.message)
        throw new Error(`Failed to fetch repository ${orgName}/${repoName}: ${error.message}`)
    }

    console.log(`Found repository: ${repo.full_name}`)

    // Save organization and repository to database
    try {
        // Upsert org first (repo.owner is the org for org repos)
        const org = repo.owner
        const orgRecord = await upsertGitHubOrg({
            id: org.id,
            login: org.login,
            name: org.name || null,
            description: org.description || null,
            avatar_url: org.avatar_url || null,
            html_url: org.html_url || null
        })
        await upsertGitHubRepo({
            id: repo.id,
            org_id: orgRecord.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            fork: repo.fork,
            html_url: repo.html_url
        })
    } catch (error: any) {
        console.error(`Error saving repo ${repo.name}:`, error.message)
        throw error
    }

    // --- COMMITS ---
    console.log(`Processing commits for ${repo.name}...`)

    // Get existing commit SHAs from database
    const existingCommitShas = await getExistingCommitShas(repo.id)
    console.log(`Found ${existingCommitShas.size} existing commits for ${repo.name}`)

    let commitsPage = 1
    let hasMoreCommits = true
    let newCommitsCount = 0
    let totalCommitsProcessed = 0

    while (hasMoreCommits) {
        try {
            const commitsResponse = await retryWithBackoff(() =>
                axios.get(`https://api.github.com/repos/${orgName}/${repoName}/commits`, {
                    params: {
                        per_page: 100,
                        page: commitsPage
                    },
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                })
            )

            if (commitsResponse.data.length === 0) {
                hasMoreCommits = false
            } else {
                for (const commit of commitsResponse.data) {
                    totalCommitsProcessed++

                    // Skip if we already have this commit
                    if (existingCommitShas.has(commit.sha)) {
                        continue
                    }

                    // Upsert author and committer as contributors
                    let authorId = null
                    let committerId = null
                    if (commit.author && commit.author.login) {
                        const author = await upsertContributor({
                            login: commit.author.login,
                            avatar_url: commit.author.avatar_url
                        })
                        authorId = author.id
                    }
                    if (commit.committer && commit.committer.login) {
                        const committer = await upsertContributor({
                            login: commit.committer.login,
                            avatar_url: commit.committer.avatar_url
                        })
                        committerId = committer.id
                    }

                    // Fetch commit details for stats/files/parents
                    let commitDetails = commit
                    if (!commit.stats || !commit.files) {
                        // Need to fetch full commit details
                        const commitDetailsResp = await retryWithBackoff(() =>
                            axios.get(`https://api.github.com/repos/${orgName}/${repoName}/commits/${commit.sha}`, {
                                headers: {
                                    'Accept': 'application/vnd.github.v3+json',
                                    'Authorization': `token ${githubToken}`
                                }
                            })
                        )
                        commitDetails = commitDetailsResp.data
                    }

                    const isMerge = (commitDetails.parents && commitDetails.parents.length > 1)
                    await upsertCommit({
                        sha: commit.sha,
                        repo_id: repo.id,
                        author_id: authorId,
                        committer_id: committerId,
                        message: commit.commit.message,
                        date: commit.commit.author.date,
                        additions: commitDetails.stats ? commitDetails.stats.additions : null,
                        deletions: commitDetails.stats ? commitDetails.stats.deletions : null,
                        total_changes: commitDetails.stats ? commitDetails.stats.total : null,
                        files_changed: commitDetails.files ? commitDetails.files.length : null,
                        is_merge: isMerge,
                        parent_shas: commitDetails.parents ? commitDetails.parents.map((p: any) => p.sha) : []
                    })

                    newCommitsCount++
                }

                // Continue to next page to check for any missing commits
                commitsPage++
            }
        } catch (error: any) {
            if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                console.warn(`Skipping commits for ${repo.name}: ${error.message}`)
            } else {
                console.error(`Error fetching commits for ${repo.name}:`, error.message)
            }
            hasMoreCommits = false
        }
    }

    console.log(`Processed ${totalCommitsProcessed} commits from GitHub, added ${newCommitsCount} new commits for ${repo.name}`)

    // --- PULL REQUESTS ---
    console.log(`Processing pull requests for ${repo.name}...`)

    // Get existing PR numbers from database
    const existingPRNumbers = await getExistingPRNumbers(repo.id)
    console.log(`Found ${existingPRNumbers.size} existing pull requests for ${repo.name}`)

    let prsPage = 1
    let hasMorePRs = true
    let newPRsCount = 0
    let totalPRsProcessed = 0

    while (hasMorePRs) {
        try {
            const prsResponse = await retryWithBackoff(() =>
                axios.get(`https://api.github.com/repos/${orgName}/${repoName}/pulls`, {
                    params: {
                        state: 'all',
                        per_page: 100,
                        page: prsPage
                    },
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                })
            )

            if (prsResponse.data.length === 0) {
                hasMorePRs = false
            } else {
                for (const pr of prsResponse.data) {
                    totalPRsProcessed++

                    // Skip if we already have this PR
                    if (existingPRNumbers.has(pr.number)) {
                        continue
                    }

                    // Upsert user and merged_by as contributors
                    let userId = null
                    let mergedById = null
                    if (pr.user && pr.user.login) {
                        const user = await upsertContributor({
                            login: pr.user.login,
                            avatar_url: pr.user.avatar_url
                        })
                        userId = user.id
                    }
                    if (pr.merged_by && pr.merged_by.login) {
                        const mergedBy = await upsertContributor({
                            login: pr.merged_by.login,
                            avatar_url: pr.merged_by.avatar_url
                        })
                        mergedById = mergedBy.id
                    }

                    // Fetch full PR details for body, timestamps, stats, reviewers, assignees, labels, commits
                    const prDetailsResp = await retryWithBackoff(() =>
                        axios.get(`https://api.github.com/repos/${orgName}/${repoName}/pulls/${pr.number}`, {
                            headers: {
                                'Accept': 'application/vnd.github.v3+json',
                                'Authorization': `token ${githubToken}`
                            }
                        })
                    )
                    const prDetails = prDetailsResp.data

                    await upsertPullRequest({
                        number: pr.number,
                        repo_id: repo.id,
                        user_id: userId,
                        merged_by_id: mergedById,
                        title: pr.title,
                        body: prDetails.body,
                        state: prDetails.state,
                        created_at: prDetails.created_at,
                        updated_at: prDetails.updated_at,
                        closed_at: prDetails.closed_at,
                        merged_at: prDetails.merged_at,
                        additions: prDetails.additions,
                        deletions: prDetails.deletions,
                        changed_files: prDetails.changed_files,
                        commits_count: prDetails.commits
                    })

                    // Get PR record for id
                    const prRecord = await getPullRequestByNumber(repo.id, pr.number)

                    // Reviewers
                    if (prDetails.requested_reviewers && prDetails.requested_reviewers.length > 0) {
                        for (const reviewer of prDetails.requested_reviewers) {
                            if (reviewer.login) {
                                const reviewerRec = await upsertContributor({
                                    login: reviewer.login,
                                    avatar_url: reviewer.avatar_url
                                })
                                await upsertPRReviewer({
                                    pr_id: prRecord.id,
                                    reviewer_id: reviewerRec.id
                                })
                            }
                        }
                    }

                    // Assignees
                    if (prDetails.assignees && prDetails.assignees.length > 0) {
                        for (const assignee of prDetails.assignees) {
                            if (assignee.login) {
                                const assigneeRec = await upsertContributor({
                                    login: assignee.login,
                                    avatar_url: assignee.avatar_url
                                })
                                await upsertPRAssignee({
                                    pr_id: prRecord.id,
                                    assignee_id: assigneeRec.id
                                })
                            }
                        }
                    }

                    // Labels
                    if (prDetails.labels && prDetails.labels.length > 0) {
                        for (const label of prDetails.labels) {
                            await upsertPRLabel({
                                pr_id: prRecord.id,
                                label_name: label.name
                            })
                        }
                    }

                    // PR commits
                    const prCommitsResp = await retryWithBackoff(() =>
                        axios.get(`https://api.github.com/repos/${orgName}/${repoName}/pulls/${pr.number}/commits`, {
                            headers: {
                                'Accept': 'application/vnd.github.v3+json',
                                'Authorization': `token ${githubToken}`
                            }
                        })
                    )
                    for (const prCommit of prCommitsResp.data) {
                        await upsertPRCommit({
                            pr_id: prRecord.id,
                            commit_sha: prCommit.sha
                        })
                    }

                    newPRsCount++
                }

                // Continue to next page to check for any missing PRs
                prsPage++
            }
        } catch (error: any) {
            if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                console.warn(`Skipping PRs for ${repo.name}: ${error.message}`)
            } else {
                console.error(`Error fetching PRs for ${repo.name}:`, error.message)
            }
            hasMorePRs = false
        }
    }

    console.log(`Processed ${totalPRsProcessed} pull requests from GitHub, added ${newPRsCount} new pull requests for ${repo.name}`)

    // --- ISSUES ---
    console.log(`Processing issues for ${repo.name}...`)

    // Get existing issue numbers from database
    const existingIssueNumbers = await getExistingIssueNumbers(repo.id)
    console.log(`Found ${existingIssueNumbers.size} existing issues for ${repo.name}`)

    let issuesPage = 1
    let hasMoreIssues = true
    let newIssuesCount = 0
    let totalIssuesProcessed = 0

    while (hasMoreIssues) {
        try {
            const issuesResponse = await retryWithBackoff(() =>
                axios.get(`https://api.github.com/repos/${orgName}/${repoName}/issues`, {
                    params: {
                        state: 'all',
                        per_page: 100,
                        page: issuesPage
                    },
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                })
            )

            if (issuesResponse.data.length === 0) {
                hasMoreIssues = false
            } else {
                for (const issue of issuesResponse.data) {
                    // Skip if this is a pull request (already handled)
                    if (issue.pull_request) continue

                    totalIssuesProcessed++

                    // Skip if we already have this issue
                    if (existingIssueNumbers.has(issue.number)) {
                        continue
                    }

                    // Upsert user as contributor
                    let userId = null
                    if (issue.user && issue.user.login) {
                        const user = await upsertContributor({
                            login: issue.user.login,
                            avatar_url: issue.user.avatar_url
                        })
                        userId = user.id
                    }

                    await upsertIssue({
                        number: issue.number,
                        repo_id: repo.id,
                        user_id: userId,
                        title: issue.title,
                        body: issue.body,
                        state: issue.state,
                        created_at: issue.created_at,
                        updated_at: issue.updated_at,
                        closed_at: issue.closed_at,
                        comments_count: issue.comments,
                        is_pull_request: false,
                        milestone_title: issue.milestone ? issue.milestone.title : null
                    })

                    // Get issue record for id
                    const issueRecord = await getIssueByNumber(repo.id, issue.number)

                    // Assignees
                    if (issue.assignees && issue.assignees.length > 0) {
                        for (const assignee of issue.assignees) {
                            if (assignee.login) {
                                const assigneeRec = await upsertContributor({
                                    login: assignee.login,
                                    avatar_url: assignee.avatar_url
                                })
                                await upsertIssueAssignee({
                                    issue_id: issueRecord.id,
                                    assignee_id: assigneeRec.id
                                })
                            }
                        }
                    }

                    // Labels
                    if (issue.labels && issue.labels.length > 0) {
                        for (const label of issue.labels) {
                            await upsertIssueLabel({
                                issue_id: issueRecord.id,
                                label_name: label.name
                            })
                        }
                    }

                    newIssuesCount++
                }

                // Continue to next page to check for any missing issues
                issuesPage++
            }
        } catch (error: any) {
            if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                console.warn(`Skipping issues for ${repo.name}: ${error.message}`)
            } else {
                console.error(`Error fetching issues for ${repo.name}:`, error.message)
            }
            hasMoreIssues = false
        }
    }

    console.log(`Processed ${totalIssuesProcessed} issues from GitHub, added ${newIssuesCount} new issues for ${repo.name}`)
    console.log('✅ Contributors, commits, and pull requests saved successfully')
}

export default async (req: Request, context: Context) => {
    console.log('🚀 GitHub Stats background function started')
    console.log('📅 Timestamp:', new Date().toISOString())

    const url = new URL(req.url)
    const githubToken = url.searchParams.get('githubToken') || ''
    const orgName = url.searchParams.get('org') || ''
    const repoName = url.searchParams.get('repo') || ''

    console.log('🔍 Request URL:', req.url)
    console.log('🔑 GitHub Token provided:', githubToken ? '✅ Yes' : '❌ No')
    console.log('🏢 Organization:', orgName || '❌ Missing')
    console.log('📦 Repository:', repoName || '❌ Missing')

    if (!githubToken || !orgName || !repoName) {
        console.log('❌ Missing required parameters, returning 400 error')
        return new Response(
            JSON.stringify({
                error: 'Missing required parameters',
                required: ['githubToken', 'org', 'repo'],
                provided: {
                    githubToken: !!githubToken,
                    org: !!orgName,
                    repo: !!repoName
                }
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    try {
        console.log('🔄 Starting to process GitHub data')
        console.log('🔧 Environment check - Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')

        // Fetch and save all GitHub data
        await fetchAndSaveContributorsAndActivity(githubToken, orgName, repoName)


        console.log('🎉 Processing Complete!')

        return new Response(
            JSON.stringify({
                success: true,
                message: 'GitHub stats fetched and saved successfully',
                timestamp: new Date().toISOString()
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (err: any) {
        console.error('❌ Failed to process GitHub stats:', err)
        console.error('🔍 Error details:', {
            name: err instanceof Error ? err.name : 'Unknown',
            message: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined
        })

        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                details: err instanceof Error ? err.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}
