import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import {
    upsertPackage,
    updatePackageStats,
    insertPackageStatsHistory,
    upsertGitHubRepo,
    upsertContributor,
    updateContributorStats,
    upsertMonthlyDownloads,
    getAllPackages,
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

// Read org-stats-config.json and parse npmPackages
const orgStatsConfigPath = path.resolve(__dirname || path.dirname(new URL(import.meta.url).pathname), '../../org-stats-config.json');
const orgStatsConfig = JSON.parse(fs.readFileSync(orgStatsConfigPath, 'utf-8'));
const npmPackagesConfig = orgStatsConfig.npmPackages;

async function fetchPackageStats(pkgConfig, githubToken) {
    const packageName = pkgConfig.name;
    const githubPackageId = pkgConfig.github_package_id;
    const dependentsUrlOverride = pkgConfig.dependents_url;
    console.log(`Fetching stats for ${packageName}...`);

    // Search for package in package.json
    const packageJsonResponse = await axios.get(
        'https://api.github.com/search/code',
        {
            params: { q: `"${packageName}" in:file filename:package.json` },
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubToken}`
            }
        }
    );

    // Search for package in any file
    const anyFileResponse = await axios.get(
        'https://api.github.com/search/code',
        {
            params: { q: `"${packageName}"` },
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${githubToken}`
            }
        }
    );

    // Get package info from npm registry
    const packageInfo = await axios.get(`https://registry.npmjs.org/${packageName}`);
    const latestVersion = packageInfo.data['dist-tags'].latest;

    // Get dependents count from npm registry
    const dependentsResponse = await axios.get(
        'https://registry.npmjs.org/-/v1/search',
        {
            params: { text: `dependencies:${packageName}`, size: 1 }
        }
    );

    // Fetch GitHub dependents count using Cheerio (scrape GitHub dependents page)
    let githubDependentsCount = null;
    try {
        let dependentsUrl = null;
        if (githubPackageId) {
            dependentsUrl = `https://github.com/MeshJS/mesh/network/dependents?package_id=${githubPackageId}`;
        } else if (dependentsUrlOverride) {
            dependentsUrl = dependentsUrlOverride;
        }
        if (dependentsUrl) {
            const response = await axios.get(dependentsUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const selector = 'a.btn-link.selected';
            const countText = $(selector).text().trim();
            if (countText) {
                const [rawCount] = countText.split(' ');
                const dependentsCount = parseInt(rawCount.replace(/,/g, ''), 10);
                if (!isNaN(dependentsCount)) {
                    githubDependentsCount = dependentsCount;
                } else {
                    console.error('Extracted text is not a valid number:', countText);
                }
            } else {
                console.error('CSS selector did not match any content.');
            }
        }
    } catch (error) {
        console.error('Error fetching GitHub dependents count using Cheerio:', error.message);
    }

    // Fetch downloads for different time periods
    const currentDate = new Date();
    const lastDay = new Date(currentDate);
    lastDay.setDate(lastDay.getDate() - 1);

    const lastWeek = new Date(currentDate);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStart = new Date(lastWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() + 1);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const lastYear = new Date(currentDate);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const lastYearStart = new Date(lastYear.getFullYear(), 0, 1);
    const lastYearEnd = new Date(lastYear.getFullYear(), 11, 31);

    const formatDate = date => date.toISOString().split('T')[0];
    const getDownloads = async (startDate, endDate) => {
        const response = await axios.get(
            `https://api.npmjs.org/downloads/point/${startDate}:${endDate}/${packageName}`
        );
        return response.data.downloads;
    };

    // Fetch last 12 months downloads (rolling window)
    const last12MonthsDownloadsResponse = await axios.get(
        `https://api.npmjs.org/downloads/point/last-year/${packageName}`
    );
    const last12MonthsDownloads = last12MonthsDownloadsResponse.data.downloads;

    const [lastDayDownloads, lastWeekDownloads, lastMonthDownloads, lastYearDownloads] = await Promise.all([
        getDownloads(formatDate(lastDay), formatDate(currentDate)),
        getDownloads(formatDate(lastWeekStart), formatDate(lastWeekEnd)),
        getDownloads(formatDate(lastMonthStart), formatDate(lastMonthEnd)),
        getDownloads(formatDate(lastYearStart), formatDate(lastYearEnd))
    ]);

    return {
        github_in_package_json: packageJsonResponse.data.total_count,
        github_in_any_file: anyFileResponse.data.total_count,
        github_dependents_count: githubDependentsCount,
        latest_version: latestVersion,
        npm_dependents_count: dependentsResponse.data.total,
        last_day_downloads: lastDayDownloads,
        last_week_downloads: lastWeekDownloads,
        last_month_downloads: lastMonthDownloads,
        last_year_downloads: lastYearDownloads,
        last_12_months_downloads: last12MonthsDownloads
    };
}

async function fetchMonthlyDownloadsForPackage(packageName, year) {
    const downloads = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    for (let month = 1; month <= 12; month++) {
        // Skip future months
        if (year === currentYear && month > currentMonth) {
            downloads.push({
                month,
                downloads: 0
            });
            continue;
        }

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        try {
            const response = await axios.get(
                `https://api.npmjs.org/downloads/point/${startDate}:${endDate}/${packageName}`
            );
            downloads.push({
                month,
                downloads: response.data.downloads
            });
        } catch (error) {
            console.error(`Error fetching downloads for ${packageName} in ${year}-${month}:`, error.message);
            downloads.push({
                month,
                downloads: 0
            });
        }
    }
    return downloads;
}

export async function fetchAndSaveMeshStats(githubToken) {
    console.log('Fetching and saving Mesh SDK statistics to database...');
    // Ensure all config packages exist in the DB
    let dbPackages = await getAllPackages();
    for (const pkgConfig of npmPackagesConfig) {
        const dbPkg = dbPackages.find(p => p.name === pkgConfig.name);
        if (!dbPkg) {
            // Insert missing package
            try {
                await upsertPackage({ name: pkgConfig.name });
                console.log(`Inserted missing package: ${pkgConfig.name}`);
            } catch (err) {
                console.error(`Failed to insert package ${pkgConfig.name}:`, err.message);
            }
        }
    }
    // Fetch the updated DB package list
    dbPackages = await getAllPackages();
    // Map config packages to DB packages by name
    for (const pkgConfig of npmPackagesConfig) {
        const dbPkg = dbPackages.find(p => p.name === pkgConfig.name);
        if (!dbPkg) {
            console.warn(`Package ${pkgConfig.name} not found in DB, skipping.`);
            continue;
        }
        console.log(`\nProcessing package: ${pkgConfig.name}`);
        try {
            // Fetch stats for this package
            const stats = await fetchPackageStats(pkgConfig, githubToken);
            // Update package with new stats
            await updatePackageStats(dbPkg.id, {
                latest_version: stats.latest_version,
                npm_dependents_count: stats.npm_dependents_count,
                github_in_any_file: stats.github_in_any_file,
                github_in_repositories: stats.github_in_package_json,
                github_dependents_count: stats.github_dependents_count,
                last_day_downloads: stats.last_day_downloads,
                last_week_downloads: stats.last_week_downloads,
                last_month_downloads: stats.last_month_downloads,
                last_year_downloads: stats.last_year_downloads,
                last_12_months_downloads: stats.last_12_months_downloads,
                updated_at: new Date().toISOString()
            });
            // Save to history
            const now = new Date();
            const year = now.getFullYear();
            const monthNum = now.getMonth() + 1;
            const monthStr = `${year}-${String(monthNum).padStart(2, '0')}`;
            // Fetch monthly downloads for this package and year
            const monthlyDownloadsArr = await fetchMonthlyDownloadsForPackage(pkgConfig.name, year);
            const thisMonthDownloads = monthlyDownloadsArr.find(m => m.month === monthNum)?.downloads ?? 0;
            await insertPackageStatsHistory(dbPkg.id, monthStr, {
                npm_dependents_count: stats.npm_dependents_count,
                github_in_any_file: stats.github_in_any_file,
                github_in_repositories: stats.github_in_package_json,
                github_dependents_count: stats.github_dependents_count,
                package_downloads: thisMonthDownloads
            });
            console.log(`✅ Updated stats for ${pkgConfig.name}`);
        } catch (error) {
            console.error(`❌ Error processing ${pkgConfig.name}:`, error.message);
            await sendDiscordNotification(`⚠️ Error processing package ${pkgConfig.name}: ${error.message}`);
        }
    }
}

export async function fetchAndSaveMonthlyDownloads(year) {
    console.log(`\nFetching monthly downloads for year ${year}...`);

    const packages = await getAllPackages();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    for (const pkg of packages) {
        console.log(`Processing monthly downloads for ${pkg.name}...`);

        try {
            const monthlyDownloads = await fetchMonthlyDownloadsForPackage(pkg.name, year);

            // Save monthly downloads to database
            for (const monthData of monthlyDownloads) {
                // Skip future months
                if (year === currentYear && monthData.month > currentMonth) {
                    continue;
                }

                await upsertMonthlyDownloads(pkg.id, year, monthData.month, monthData.downloads);
            }

            console.log(`✅ Saved monthly downloads for ${pkg.name}`);
        } catch (error) {
            console.error(`❌ Error processing monthly downloads for ${pkg.name}:`, error.message);
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