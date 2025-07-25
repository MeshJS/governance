import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Database operations for packages
export async function upsertPackage(packageData) {
    const { data, error } = await supabase
        .from('packages')
        .upsert(packageData, { onConflict: 'name' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getPackageByName(name) {
    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('name', name)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
}

export async function updatePackageStats(packageId, stats) {
    const { data, error } = await supabase
        .from('packages')
        .update(stats)
        .eq('id', packageId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function insertPackageStatsHistory(packageId, month, stats) {
    // Only keep the allowed fields
    const allowed = [
        'npm_dependents_count',
        'github_in_any_file',
        'github_in_repositories',
        'github_dependents_count',
        'package_downloads'
    ];
    const filteredStats = Object.fromEntries(
        Object.entries(stats).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
        .from('package_stats_history')
        .upsert({
            package_id: packageId,
            month,
            ...filteredStats
        }, { onConflict: 'package_id,month' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Database operations for GitHub repositories
export async function upsertGitHubRepo(repoData) {
    const { data, error } = await supabase
        .from('github_repos')
        .upsert({
            id: repoData.id, // Use GitHub repo ID as primary key
            org_id: repoData.org_id, // New: org_id
            name: repoData.name,
            full_name: repoData.full_name,
            description: repoData.description,
            private: repoData.private,
            fork: repoData.fork,
            html_url: repoData.html_url
        }, { onConflict: 'id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getGitHubRepoByFullName(fullName) {
    const { data, error } = await supabase
        .from('github_repos')
        .select('*')
        .eq('full_name', fullName)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// Database operations for contributors
export async function upsertContributor(contributorData) {
    const { data, error } = await supabase
        .from('contributors')
        .upsert(contributorData, { onConflict: 'login' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getContributorByLogin(login) {
    const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('login', login)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function updateContributorStats(contributorId, stats) {
    const { data, error } = await supabase
        .from('contributors')
        .update(stats)
        .eq('id', contributorId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Database operations for monthly downloads
export async function upsertMonthlyDownloads(packageId, year, month, downloads) {
    const { data, error } = await supabase
        .from('monthly_downloads')
        .upsert({
            package_id: packageId,
            year,
            month,
            downloads
        }, { onConflict: 'package_id,year,month' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Check if monthly_downloads data exists for a package
export async function hasMonthlyDownloadsData(packageId) {
    const { data, error } = await supabase
        .from('monthly_downloads')
        .select('id')
        .eq('package_id', packageId)
        .limit(1);
    if (error) throw error;
    return data && data.length > 0;
}

// Check if package_stats_history data exists for a package
export async function hasPackageStatsHistoryData(packageId) {
    const { data, error } = await supabase
        .from('package_stats_history')
        .select('id')
        .eq('package_id', packageId)
        .limit(1);
    if (error) throw error;
    return data && data.length > 0;
}

// Database operations for commits
export async function upsertCommit(commitData) {
    const { data, error } = await supabase
        .from('commits')
        .upsert(commitData, { onConflict: 'sha' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getCommitBySha(sha) {
    const { data, error } = await supabase
        .from('commits')
        .select('*')
        .eq('sha', sha)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// Database operations for pull requests
export async function upsertPullRequest(prData) {
    const { data, error } = await supabase
        .from('pull_requests')
        .upsert(prData, { onConflict: 'repo_id,number' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getPullRequestByNumber(repoId, number) {
    const { data, error } = await supabase
        .from('pull_requests')
        .select('*')
        .eq('repo_id', repoId)
        .eq('number', number)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// Database operations for PR reviewers
export async function upsertPRReviewer(prReviewerData) {
    const { data, error } = await supabase
        .from('pr_reviewers')
        .upsert(prReviewerData, { onConflict: 'pr_id,reviewer_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Database operations for PR assignees
export async function upsertPRAssignee(prAssigneeData) {
    const { data, error } = await supabase
        .from('pr_assignees')
        .upsert(prAssigneeData, { onConflict: 'pr_id,assignee_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Database operations for PR labels
export async function upsertPRLabel(prLabelData) {
    const { data, error } = await supabase
        .from('pr_labels')
        .upsert(prLabelData, { onConflict: 'pr_id,label_name' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Database operations for PR-commit links
export async function upsertPRCommit(prCommitData) {
    const { data, error } = await supabase
        .from('pr_commits')
        .upsert(prCommitData, { onConflict: 'pr_id,commit_sha' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Database operations for issues
export async function upsertIssue(issueData) {
    const { data, error } = await supabase
        .from('issues')
        .upsert(issueData, { onConflict: 'repo_id,number' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getIssueByNumber(repoId, number) {
    const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('repo_id', repoId)
        .eq('number', number)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// Database operations for issue assignees
export async function upsertIssueAssignee(issueAssigneeData) {
    const { data, error } = await supabase
        .from('issue_assignees')
        .upsert(issueAssigneeData, { onConflict: 'issue_id,assignee_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Database operations for issue labels
export async function upsertIssueLabel(issueLabelData) {
    const { data, error } = await supabase
        .from('issue_labels')
        .upsert(issueLabelData, { onConflict: 'issue_id,label_name' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Database operations for GitHub organizations
export async function upsertGitHubOrg(orgData) {
    const { data, error } = await supabase
        .from('github_orgs')
        .upsert({
            id: orgData.id, // GitHub org ID
            login: orgData.login,
            name: orgData.name,
            description: orgData.description,
            avatar_url: orgData.avatar_url,
            html_url: orgData.html_url
        }, { onConflict: 'id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getGitHubOrgByLogin(login) {
    const { data, error } = await supabase
        .from('github_orgs')
        .select('*')
        .eq('login', login)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

// Utility function to clear old data (for fresh imports)
export async function clearOldData() {
    console.log('Clearing old data...');

    // Clear in reverse order of dependencies
    await supabase.from('pr_commits').delete().neq('id', 0);
    await supabase.from('pr_labels').delete().neq('id', 0);
    await supabase.from('pr_assignees').delete().neq('id', 0);
    await supabase.from('pr_reviewers').delete().neq('id', 0);
    await supabase.from('pull_requests').delete().neq('id', 0);
    await supabase.from('commits').delete().neq('id', 0);
    await supabase.from('contributors').delete().neq('id', 0);
    await supabase.from('github_repos').delete().neq('id', 0);
    await supabase.from('package_stats_history').delete().neq('id', 0);
    await supabase.from('monthly_downloads').delete().neq('id', 0);
    await supabase.from('issues').delete().neq('id', 0);
    await supabase.from('issue_assignees').delete().neq('id', 0);
    await supabase.from('issue_labels').delete().neq('id', 0);
    await supabase.from('github_orgs').delete().neq('id', 0); // Clear orgs last

    console.log('Old data cleared successfully');
}

// Utility function to get all packages
export async function getAllPackages() {
    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

// Get the latest commit date for a repo
export async function getLatestCommitDate(repoId) {
    const { data, error } = await supabase
        .from('commits')
        .select('date')
        .eq('repo_id', repoId)
        .order('date', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.date : null;
}

// Get the latest pull request created_at for a repo
export async function getLatestPullRequestDate(repoId) {
    const { data, error } = await supabase
        .from('pull_requests')
        .select('created_at')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.created_at : null;
}

// Get the latest issue created_at for a repo
export async function getLatestIssueDate(repoId) {
    const { data, error } = await supabase
        .from('issues')
        .select('created_at')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? data.created_at : null;
}

// Get all existing commit SHAs for a repo
export async function getExistingCommitShas(repoId) {
    const { data, error } = await supabase
        .from('commits')
        .select('sha')
        .eq('repo_id', repoId);
    if (error) throw error;
    return new Set(data.map(commit => commit.sha));
}

// Get all existing PR numbers for a repo
export async function getExistingPRNumbers(repoId) {
    const { data, error } = await supabase
        .from('pull_requests')
        .select('number')
        .eq('repo_id', repoId);
    if (error) throw error;
    return new Set(data.map(pr => pr.number));
}

// Get all existing issue numbers for a repo
export async function getExistingIssueNumbers(repoId) {
    const { data, error } = await supabase
        .from('issues')
        .select('number')
        .eq('repo_id', repoId);
    if (error) throw error;
    return new Set(data.map(issue => issue.number));
} 