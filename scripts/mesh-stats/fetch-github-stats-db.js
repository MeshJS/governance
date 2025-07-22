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
    getLatestIssueDate
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

export async function fetchAndSaveContributorsAndActivity(githubToken) {
    console.log('\nFetching and saving repository contributors, commits, and pull requests...');

    // Get all repositories with pagination
    let allRepos = [];
    let page = 1;
    let hasMoreRepos = true;

    while (hasMoreRepos) {
        try {
            console.log(`Fetching repositories page ${page}...`);
            const reposResponse = await axios.get('https://api.github.com/orgs/MeshJS/repos', {
                params: {
                    type: 'all',
                    per_page: 100,
                    page: page
                },
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${githubToken}`
                }
            });

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

    // Save repositories to database
    for (const repo of allRepos) {
        try {
            await upsertGitHubRepo({
                id: repo.id, // GitHub repository ID
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
        let commitsPage = 1;
        let hasMoreCommits = true;
        // Get latest commit date for this repo (buffer: minus 1 month)
        let since = undefined;
        const latestCommitDate = await getLatestCommitDate(repo.id);
        if (latestCommitDate) {
            const bufferDate = new Date(new Date(latestCommitDate).getTime() - 30 * 24 * 60 * 60 * 1000);
            since = bufferDate.toISOString();
        }
        while (hasMoreCommits) {
            try {
                const params = {
                    per_page: 100,
                    page: commitsPage
                };
                if (since) params.since = since;
                const commitsResponse = await axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/commits`, {
                    params,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                });
                if (commitsResponse.data.length === 0) {
                    hasMoreCommits = false;
                } else {
                    for (const commit of commitsResponse.data) {
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
                            const commitDetailsResp = await axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/commits/${commit.sha}`, {
                                headers: {
                                    'Accept': 'application/vnd.github.v3+json',
                                    'Authorization': `token ${githubToken}`
                                }
                            });
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
                    }
                    commitsPage++;
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
    }

    // --- PULL REQUESTS ---
    for (const repo of allRepos) {
        console.log(`Processing pull requests for ${repo.name}...`);
        let prsPage = 1;
        let hasMorePRs = true;
        // Get latest PR date for this repo (buffer: minus 1 month)
        let since = undefined;
        const latestPRDate = await getLatestPullRequestDate(repo.id);
        if (latestPRDate) {
            const bufferDate = new Date(new Date(latestPRDate).getTime() - 30 * 24 * 60 * 60 * 1000);
            since = bufferDate.toISOString();
        }
        while (hasMorePRs) {
            try {
                const params = {
                    state: 'all',
                    per_page: 100,
                    page: prsPage
                };
                if (since) params.since = since;
                const prsResponse = await axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/pulls`, {
                    params,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                });
                if (prsResponse.data.length === 0) {
                    hasMorePRs = false;
                } else {
                    for (const pr of prsResponse.data) {
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
                        const prDetailsResp = await axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/pulls/${pr.number}`, {
                            headers: {
                                'Accept': 'application/vnd.github.v3+json',
                                'Authorization': `token ${githubToken}`
                            }
                        });
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
                        const prCommitsResp = await axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/pulls/${pr.number}/commits`, {
                            headers: {
                                'Accept': 'application/vnd.github.v3+json',
                                'Authorization': `token ${githubToken}`
                            }
                        });
                        for (const prCommit of prCommitsResp.data) {
                            await upsertPRCommit({
                                pr_id: prRecord.id,
                                commit_sha: prCommit.sha
                            });
                        }
                    }
                    prsPage++;
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
    }

    // --- ISSUES ---
    for (const repo of allRepos) {
        console.log(`Processing issues for ${repo.name}...`);
        let issuesPage = 1;
        let hasMoreIssues = true;
        // Get latest issue date for this repo (buffer: minus 1 month)
        let since = undefined;
        const latestIssueDate = await getLatestIssueDate(repo.id);
        if (latestIssueDate) {
            const bufferDate = new Date(new Date(latestIssueDate).getTime() - 30 * 24 * 60 * 60 * 1000);
            since = bufferDate.toISOString();
        }
        while (hasMoreIssues) {
            try {
                const params = {
                    state: 'all',
                    per_page: 100,
                    page: issuesPage
                };
                if (since) params.since = since;
                const issuesResponse = await axios.get(`https://api.github.com/repos/MeshJS/${repo.name}/issues`, {
                    params,
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'Authorization': `token ${githubToken}`
                    }
                });
                if (issuesResponse.data.length === 0) {
                    hasMoreIssues = false;
                } else {
                    for (const issue of issuesResponse.data) {
                        // Skip if this is a pull request (already handled)
                        if (issue.pull_request) continue;
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
                    }
                    issuesPage++;
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
    }
    console.log('✅ Contributors, commits, and pull requests saved successfully');
} 