/**
 * Fetch GitHub stats for the nomos-guild organization and write to JSON.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/nomos-stats/fetch-nomos-github-stats.js
 *
 * Output: community-config-registry/nomos-guild/github-stats.json
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORG = 'nomos-guild';
const SKIP_REPOS = ['.github']; // org profile repo, no useful code
const OUTPUT_PATH = join(__dirname, '..', '..', 'community-config-registry', 'nomos-guild', 'github-stats.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const headers = {
  Accept: 'application/vnd.github.v3+json',
  ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function ghFetch(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} for ${url}: ${text}`);
  }
  return res.json();
}

/** Paginate a GitHub list endpoint. */
async function ghPaginate(url, params = {}) {
  const all = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const qs = new URLSearchParams({ ...params, per_page: String(perPage), page: String(page) });
    const fullUrl = `${url}?${qs}`;
    try {
      const data = await ghFetch(fullUrl);
      if (!Array.isArray(data) || data.length === 0) break;
      all.push(...data);
      if (data.length < perPage) break;
      page++;
    } catch (err) {
      // 409 = empty repo, 404 = disabled, skip silently
      if (err.message.includes('409') || err.message.includes('404')) break;
      throw err;
    }
  }
  return all;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Fetching repos for ${ORG}...`);
  const repos = await ghPaginate(`https://api.github.com/orgs/${ORG}/repos`, { type: 'all' });
  const activeRepos = repos.filter(r => !r.archived && !SKIP_REPOS.includes(r.name));
  console.log(`Found ${activeRepos.length} active repos (skipped ${repos.length - activeRepos.length})`);

  const repoStats = [];
  // contributor login -> aggregated data
  const contributorMap = new Map();

  for (const repo of activeRepos) {
    const repoName = repo.name;
    console.log(`\nProcessing ${repoName}...`);

    repoStats.push({
      name: repoName,
      full_name: repo.full_name,
      description: repo.description || '',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
    });

    // --- Commits ---
    console.log(`  Fetching commits...`);
    const commits = await ghPaginate(`https://api.github.com/repos/${ORG}/${repoName}/commits`);
    console.log(`  ${commits.length} commits`);

    for (const c of commits) {
      const login = c.author?.login;
      if (!login) continue;

      if (!contributorMap.has(login)) {
        contributorMap.set(login, {
          login,
          avatar_url: c.author.avatar_url || '',
          repos: {},
        });
      }
      const contributor = contributorMap.get(login);
      if (!contributor.repos[repoName]) {
        contributor.repos[repoName] = { commits: 0, pull_requests: 0, commit_timestamps: [], pr_timestamps: [] };
      }
      contributor.repos[repoName].commits++;
      contributor.repos[repoName].commit_timestamps.push(c.commit?.author?.date || c.commit?.committer?.date || '');
    }

    // --- Pull Requests (merged only) ---
    console.log(`  Fetching pull requests...`);
    const prs = await ghPaginate(`https://api.github.com/repos/${ORG}/${repoName}/pulls`, { state: 'all' });
    console.log(`  ${prs.length} pull requests`);

    for (const pr of prs) {
      const login = pr.user?.login;
      if (!login) continue;

      if (!contributorMap.has(login)) {
        contributorMap.set(login, {
          login,
          avatar_url: pr.user.avatar_url || '',
          repos: {},
        });
      }
      const contributor = contributorMap.get(login);
      if (!contributor.repos[repoName]) {
        contributor.repos[repoName] = { commits: 0, pull_requests: 0, commit_timestamps: [], pr_timestamps: [] };
      }
      contributor.repos[repoName].pull_requests++;
      contributor.repos[repoName].pr_timestamps.push(pr.created_at || '');
    }
  }

  // --- Build output matching ContributorStats type ---
  let totalCommits = 0;
  let totalPRs = 0;

  const contributors = Array.from(contributorMap.values())
    .filter(c => !c.login.includes('[bot]') && c.login !== 'actions-user')
    .map(c => {
      let commits = 0;
      let pullRequests = 0;
      const repositories = Object.entries(c.repos).map(([name, data]) => {
        commits += data.commits;
        pullRequests += data.pull_requests;
        return {
          name,
          commits: data.commits,
          pull_requests: data.pull_requests,
          commit_timestamps: data.commit_timestamps.filter(Boolean).sort(),
          pr_timestamps: data.pr_timestamps.filter(Boolean).sort(),
        };
      });

      totalCommits += commits;
      totalPRs += pullRequests;

      return {
        login: c.login,
        avatar_url: c.avatar_url,
        commits,
        pull_requests: pullRequests,
        contributions: commits + pullRequests,
        repositories,
      };
    })
    .sort((a, b) => b.contributions - a.contributions);

  const output = {
    lastFetched: new Date().toISOString(),
    org: ORG,
    repoStats,
    contributorStats: {
      total_commits: totalCommits,
      total_pull_requests: totalPRs,
      total_contributions: totalCommits + totalPRs,
      unique_count: contributors.length,
      contributors,
    },
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nDone! Wrote ${OUTPUT_PATH}`);
  console.log(`  Repos: ${repoStats.length}`);
  console.log(`  Contributors: ${contributors.length}`);
  console.log(`  Commits: ${totalCommits}, PRs: ${totalPRs}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
