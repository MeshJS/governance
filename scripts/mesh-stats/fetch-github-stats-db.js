import axios from 'axios';
import {
    upsertGitHubRepo,
    upsertContributor,
    updateContributorStats,
    upsertCommit,
    getCommitBySha,
    upsertPullRequest,
    getPullRequestByNumber,
    upsertPRReviewer,
    upsertPRAssignee,
    upsertPRLabel,
    upsertPRCommit,
    upsertIssue,
    getIssueByNumber,
    upsertIssueAssignee,
    upsertIssueLabel,
    getLatestCommitDate,
    getLatestPullRequestDate,
    getLatestIssueDate,
    upsertGitHubOrg,
    getExistingCommitShas,
    getExistingPRNumbers,
    getExistingIssueNumbers
} from './database-client.js';

// Add Discord webhook URL - this should be set as an environment variable
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(message) {
    if (!DISCORD_WEBHOOK_URL) {
        console.error('Discord webhook URL not set');
        return;
    }
    try {
        await axios.post(DISCORD_WEBHOOK_URL, {
            content: message
        });
    } catch (error) {
        console.error('Failed to send Discord notification:', error.message);
    }
}

// --- GitHub Stats Logic ---

// Retry helper for GitHub API calls
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 1000) {
    let attempt = 0;
    let delay = initialDelay;
    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            const status = error.response?.status;
            // Only retry on 403, 429, or 5xx errors
            if ([403, 429].includes(status) || (status >= 500 && status < 600)) {
                attempt++;
                if (attempt === maxRetries) throw error;
                console.warn(`Retrying after error ${status} (attempt ${attempt}/${maxRetries})...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error;
            }
        }
    }
}

export async function fetchAndSaveContributorsAndActivity(githubToken) {
    console.log('\nFetching and saving repository contributors, commits, and pull requests...');

    // Get all repositories with pagination
    let allRepos = [];
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos) {
        try {
            console.log(`Fetching repositories page ${page}...`);
            const reposResponse = await retryWithBackoff(() =>
                axios.get('https://api.github.com/orgs/MeshJS/repos', {
                    params: {
                        type: 'all',
                        per_page: 100,
                        page: page
                    },
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                })
            );

            if (reposResponse.data.length === 0) {
                hasMoreRepos = false;
            } else {
                allRepos = allRepos.concat(reposResponse.data);
                page++;
            }
        } catch (error) {
            console.error(`Error fetching repositories page ${page}:`, error.message);
            hasMoreRepos = false;
        }
    }

    console.log(`Found ${allRepos.length} repositories in the MeshJS organization`);

    // Save organizations and repositories to database
    for (const repo of allRepos) {
        try {
            // Upsert org first (repo.owner is the org for org repos)
            const org = repo.owner;
            const orgRecord = await upsertGitHubOrg({
                id: org.id,
                login: org.login,
                name: org.name || null,
                description: org.description || null,
                avatar_url: org.avatar_url || null,
                html_url: org.html_url || null
            });
            await upsertGitHubRepo({
                id: repo.id, // GitHub repository ID
                org_id: orgRecord.id, // New: org_id
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                private: repo.private,
                fork: repo.fork,
                html_url: repo.html_url
            });
        } catch (error) {
            console.error(`Error saving repo ${repo.name}:`, error.message);
        }
    }

    // --- COMMITS ---
    for (const repo of allRepos) {
        console.log(`Processing commits for ${repo.name}...`);

        // Get existing commit SHAs from database
        const existingCommitShas = await getExistingCommitShas(repo.id);
        console.log(`Found ${existingCommitShas.size} existing commits for ${repo.name}`);

        let commitsPage = 1;
        let hasMoreCommits = true;
        let newCommitsCount = 0;

        while (hasMoreCommits) {
            try {
                const commitsResponse = await retryWithBackoff(() =>
                    axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/commits`, {
                        params: {
                            per_page: 100,
                            page: commitsPage
                        },
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'Authorization': `token ${githubToken}`
                        }
                    })
                );

                if (commitsResponse.data.length === 0) {
                    hasMoreCommits = false;
                } else {
                    let foundExistingCommit = false;

                    for (const commit of commitsResponse.data) {
                        // Skip if we already have this commit
                        if (existingCommitShas.has(commit.sha)) {
                            foundExistingCommit = true;
                            continue;
                        }

                        // Upsert author and committer as contributors
                        let authorId = null;
                        let committerId = null;
                        if (commit.author && commit.author.login) {
                            const author = await upsertContributor({
                                login: commit.author.login,
                                avatar_url: commit.author.avatar_url
                            });
                            authorId = author.id;
                        }
                        if (commit.committer && commit.committer.login) {
                            const committer = await upsertContributor({
                                login: commit.committer.login,
                                avatar_url: commit.committer.avatar_url
                            });
                            committerId = committer.id;
                        }

                        // Fetch commit details for stats/files/parents
                        let commitDetails = commit;
                        if (!commit.stats || !commit.files) {
                            // Need to fetch full commit details
                            const commitDetailsResp = await retryWithBackoff(() =>
                                axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/commits/${commit.sha}`, {
                                    headers: {
                                        'Accept': 'application/vnd.github.v3+json',
                                        'Authorization': `token ${githubToken}`
                                    }
                                })
                            );
                            commitDetails = commitDetailsResp.data;
                        }

                        const isMerge = (commitDetails.parents && commitDetails.parents.length > 1);
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
                            parent_shas: commitDetails.parents ? commitDetails.parents.map(p => p.sha) : []
                        });

                        newCommitsCount++;
                    }

                    // If we found an existing commit, we've reached the end of new commits
                    if (foundExistingCommit) {
                        hasMoreCommits = false;
                    } else {
                        commitsPage++;
                    }
                }
            } catch (error) {
                if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                    console.warn(`Skipping commits for ${repo.name}: ${error.message}`);
                } else {
                    console.error(`Error fetching commits for ${repo.name}:`, error.message);
                }
                hasMoreCommits = false;
            }
        }

        console.log(`Added ${newCommitsCount} new commits for ${repo.name}`);
    }

    // --- PULL REQUESTS ---
    for (const repo of allRepos) {
        console.log(`Processing pull requests for ${repo.name}...`);

        // Get existing PR numbers from database
        const existingPRNumbers = await getExistingPRNumbers(repo.id);
        console.log(`Found ${existingPRNumbers.size} existing pull requests for ${repo.name}`);

        let prsPage = 1;
        let hasMorePRs = true;
        let newPRsCount = 0;

        while (hasMorePRs) {
            try {
                const prsResponse = await retryWithBackoff(() =>
                    axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/pulls`, {
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
                );

                if (prsResponse.data.length === 0) {
                    hasMorePRs = false;
                } else {
                    let foundExistingPR = false;

                    for (const pr of prsResponse.data) {
                        // Skip if we already have this PR
                        if (existingPRNumbers.has(pr.number)) {
                            foundExistingPR = true;
                            continue;
                        }

                        // Upsert user and merged_by as contributors
                        let userId = null;
                        let mergedById = null;
                        if (pr.user && pr.user.login) {
                            const user = await upsertContributor({
                                login: pr.user.login,
                                avatar_url: pr.user.avatar_url
                            });
                            userId = user.id;
                        }
                        if (pr.merged_by && pr.merged_by.login) {
                            const mergedBy = await upsertContributor({
                                login: pr.merged_by.login,
                                avatar_url: pr.merged_by.avatar_url
                            });
                            mergedById = mergedBy.id;
                        }

                        // Fetch full PR details for body, timestamps, stats, reviewers, assignees, labels, commits
                        const prDetailsResp = await retryWithBackoff(() =>
                            axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/pulls/${pr.number}`, {
                                headers: {
                                    'Accept': 'application/vnd.github.v3+json',
                                    'Authorization': `token ${githubToken}`
                                }
                            })
                        );
                        const prDetails = prDetailsResp.data;

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
                        });

                        // Get PR record for id
                        const prRecord = await getPullRequestByNumber(repo.id, pr.number);

                        // Reviewers
                        if (prDetails.requested_reviewers && prDetails.requested_reviewers.length > 0) {
                            for (const reviewer of prDetails.requested_reviewers) {
                                if (reviewer.login) {
                                    const reviewerRec = await upsertContributor({
                                        login: reviewer.login,
                                        avatar_url: reviewer.avatar_url
                                    });
                                    await upsertPRReviewer({
                                        pr_id: prRecord.id,
                                        reviewer_id: reviewerRec.id
                                    });
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
                                    });
                                    await upsertPRAssignee({
                                        pr_id: prRecord.id,
                                        assignee_id: assigneeRec.id
                                    });
                                }
                            }
                        }

                        // Labels
                        if (prDetails.labels && prDetails.labels.length > 0) {
                            for (const label of prDetails.labels) {
                                await upsertPRLabel({
                                    pr_id: prRecord.id,
                                    label_name: label.name
                                });
                            }
                        }

                        // PR commits
                        const prCommitsResp = await retryWithBackoff(() =>
                            axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/pulls/${pr.number}/commits`, {
                                headers: {
                                    'Accept': 'application/vnd.github.v3+json',
                                    'Authorization': `token ${githubToken}`
                                }
                            })
                        );
                        for (const prCommit of prCommitsResp.data) {
                            await upsertPRCommit({
                                pr_id: prRecord.id,
                                commit_sha: prCommit.sha
                            });
                        }

                        newPRsCount++;
                    }

                    // If we found an existing PR, we've reached the end of new PRs
                    if (foundExistingPR) {
                        hasMorePRs = false;
                    } else {
                        prsPage++;
                    }
                }
            } catch (error) {
                if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                    console.warn(`Skipping PRs for ${repo.name}: ${error.message}`);
                } else {
                    console.error(`Error fetching PRs for ${repo.name}:`, error.message);
                }
                hasMorePRs = false;
            }
        }

        console.log(`Added ${newPRsCount} new pull requests for ${repo.name}`);
    }

    // --- ISSUES ---
    for (const repo of allRepos) {
        console.log(`Processing issues for ${repo.name}...`);

        // Get existing issue numbers from database
        const existingIssueNumbers = await getExistingIssueNumbers(repo.id);
        console.log(`Found ${existingIssueNumbers.size} existing issues for ${repo.name}`);

        let issuesPage = 1;
        let hasMoreIssues = true;
        let newIssuesCount = 0;

        while (hasMoreIssues) {
            try {
                const issuesResponse = await retryWithBackoff(() =>
                    axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/issues`, {
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
                );

                if (issuesResponse.data.length === 0) {
                    hasMoreIssues = false;
                } else {
                    let foundExistingIssue = false;

                    for (const issue of issuesResponse.data) {
                        // Skip if this is a pull request (already handled)
                        if (issue.pull_request) continue;

                        // Skip if we already have this issue
                        if (existingIssueNumbers.has(issue.number)) {
                            foundExistingIssue = true;
                            continue;
                        }

                        // Upsert user as contributor
                        let userId = null;
                        if (issue.user && issue.user.login) {
                            const user = await upsertContributor({
                                login: issue.user.login,
                                avatar_url: issue.user.avatar_url
                            });
                            userId = user.id;
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
                        });

                        // Get issue record for id
                        const issueRecord = await getIssueByNumber(repo.id, issue.number);

                        // Assignees
                        if (issue.assignees && issue.assignees.length > 0) {
                            for (const assignee of issue.assignees) {
                                if (assignee.login) {
                                    const assigneeRec = await upsertContributor({
                                        login: assignee.login,
                                        avatar_url: assignee.avatar_url
                                    });
                                    await upsertIssueAssignee({
                                        issue_id: issueRecord.id,
                                        assignee_id: assigneeRec.id
                                    });
                                }
                            }
                        }

                        // Labels
                        if (issue.labels && issue.labels.length > 0) {
                            for (const label of issue.labels) {
                                await upsertIssueLabel({
                                    issue_id: issueRecord.id,
                                    label_name: label.name
                                });
                            }
                        }

                        newIssuesCount++;
                    }

                    // If we found an existing issue, we've reached the end of new issues
                    if (foundExistingIssue) {
                        hasMoreIssues = false;
                    } else {
                        issuesPage++;
                    }
                }
            } catch (error) {
                if (error.response && (error.response.status === 404 || error.response.status === 403)) {
                    console.warn(`Skipping issues for ${repo.name}: ${error.message}`);
                } else {
                    console.error(`Error fetching issues for ${repo.name}:`, error.message);
                }
                hasMoreIssues = false;
            }
        }

        console.log(`Added ${newIssuesCount} new issues for ${repo.name}`);
    }
    console.log('✅ Contributors, commits, and pull requests saved successfully');
}

// --- MAIN EXECUTION BLOCK ---
(async () => {
    try {
        console.log('--- Mesh GitHub Stats Script: START ---');
        const githubToken = process.env.GITHUB_TOKEN;
        if (!githubToken) {
            console.error('GITHUB_TOKEN environment variable is required');
            process.exit(1);
        }
        // Log Supabase envs for debug (do not print secrets)
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Supabase environment variables are missing. Exiting.');
            process.exit(1);
        }
        console.log('Environment variables loaded.');
        await fetchAndSaveContributorsAndActivity(githubToken);
        console.log('--- Mesh GitHub Stats Script: FINISHED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('--- Mesh GitHub Stats Script: ERROR ---');
        console.error(err);
        process.exit(1);
    }
})(); 