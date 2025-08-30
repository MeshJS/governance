import { supabase } from './supabase';

// Single-pass org contributor stats aggregation using the yearly materialized view
// Returns data in the final ContributorStats shape to avoid redundant transformations elsewhere
export async function getOrgContributorStats(orgLogin: string) {
  try {
    // Resolve org id
    const { data: orgs, error: orgError } = await supabase
      .from('github_orgs')
      .select('id')
      .eq('login', orgLogin);
    if (orgError) throw new Error(orgError.message);
    if (!orgs || orgs.length === 0) {
      return {
        total_commits: 0,
        total_pull_requests: 0,
        total_issues: 0,
        total_contributions: 0,
        unique_count: 0,
        lastFetched: Date.now(),
        contributors: [],
        perRepo: {},
      };
    }

    const orgId = orgs[0].id;

    // Get repos for this org
    const { data: repos, error: repoError } = await supabase
      .from('github_repos')
      .select('id, name')
      .eq('org_id', orgId);
    if (repoError) throw new Error(repoError.message);
    const repoIds = repos?.map(r => r.id) ?? [];
    if (repoIds.length === 0) {
      return {
        total_commits: 0,
        total_pull_requests: 0,
        total_issues: 0,
        total_contributions: 0,
        unique_count: 0,
        lastFetched: Date.now(),
        contributors: [],
        perRepo: {},
      };
    }

    // Pull yearly activity rows (single source of truth)
    const yearlyActivity = await supabase
      .from('contributor_activity_yearly_mat')
      .select(
        'contributor_id, login, repo_id, repo_name, commit_count, pr_count, commit_timestamps, pr_timestamps'
      )
      .in('repo_id', repoIds);
    if (yearlyActivity.error) throw new Error(yearlyActivity.error.message);

    const rows = yearlyActivity.data || [];
    if (rows.length === 0) {
      return {
        total_commits: 0,
        total_pull_requests: 0,
        total_issues: 0,
        total_contributions: 0,
        unique_count: 0,
        lastFetched: Date.now(),
        contributors: [],
        perRepo: {},
      };
    }

    // Collect contributor ids and avatar URLs
    const contributorIds = Array.from(new Set(rows.map(r => r.contributor_id).filter(Boolean)));
    const contributorsInfo =
      contributorIds.length > 0
        ? await supabase
            .from('contributors')
            .select('id, login, avatar_url')
            .in('id', contributorIds)
        : ({ data: [], error: null } as any);
    if (contributorsInfo.error) throw new Error(contributorsInfo.error.message);
    const contributorIdToAvatar = new Map<number, string>();
    const contributorIdToLogin = new Map<number, string>();
    (contributorsInfo.data || []).forEach((c: any) => {
      contributorIdToAvatar.set(c.id, c.avatar_url || '');
      if (c.login) contributorIdToLogin.set(c.id, c.login);
    });

    // Aggregation structures
    const contributorMap = new Map<
      string,
      {
        login: string;
        avatar_url: string;
        commits: number;
        pull_requests: number;
        contributions: number;
        repositories: Array<{
          name: string;
          commits: number;
          pull_requests: number;
          contributions: number;
          commit_timestamps: string[];
          pr_timestamps: string[];
        }>;
        repoNames: string[];
      }
    >();

    const perRepoMap = new Map<
      string,
      {
        total_commits: number;
        total_pull_requests: number;
        total_issues: number;
        contributors: Map<
          string,
          {
            login: string;
            avatar_url: string;
            commits: number;
            pull_requests: number;
            contributions: number;
            repositories: any[];
            repoNames: string[];
          }
        >;
        issues: any[];
        commits: any[];
        pullRequests: any[];
      }
    >();

    let total_commits = 0;
    let total_pull_requests = 0;
    let total_issues = 0;

    // Single pass over rows
    rows.forEach(row => {
      const contributorId = row.contributor_id as number;
      const login = (row.login ||
        contributorIdToLogin.get(contributorId) ||
        `unknown-${contributorId}`) as string;
      const avatar_url = contributorIdToAvatar.get(contributorId) || '';
      const repoName = row.repo_name as string | null;
      const commits = row.commit_count || 0;
      const prs = row.pr_count || 0;

      // Org totals
      total_commits += commits;
      total_pull_requests += prs;

      // Contributor bucket
      if (!contributorMap.has(login)) {
        contributorMap.set(login, {
          login,
          avatar_url,
          commits: 0,
          pull_requests: 0,
          contributions: 0,
          repositories: [],
          repoNames: [],
        });
      }
      const contributor = contributorMap.get(login)!;
      contributor.commits += commits;
      contributor.pull_requests += prs;
      contributor.contributions += commits + prs;

      if (repoName) {
        let repoStats = contributor.repositories.find(r => r.name === repoName);
        if (!repoStats) {
          repoStats = {
            name: repoName,
            commits: 0,
            pull_requests: 0,
            contributions: 0,
            commit_timestamps: [],
            pr_timestamps: [],
          };
          contributor.repositories.push(repoStats);
        }
        repoStats.commits += commits;
        repoStats.pull_requests += prs;
        repoStats.contributions += commits + prs;
        if (Array.isArray(row.commit_timestamps)) {
          repoStats.commit_timestamps.push(...row.commit_timestamps);
        }
        if (Array.isArray(row.pr_timestamps)) {
          repoStats.pr_timestamps.push(...row.pr_timestamps);
        }
        if (!contributor.repoNames.includes(repoName)) {
          contributor.repoNames.push(repoName);
        }

        // Per-repo aggregation
        if (!perRepoMap.has(repoName)) {
          perRepoMap.set(repoName, {
            total_commits: 0,
            total_pull_requests: 0,
            total_issues: 0,
            contributors: new Map(),
            issues: [],
            commits: [],
            pullRequests: [],
          });
        }
        const repoAgg = perRepoMap.get(repoName)!;
        repoAgg.total_commits += commits;
        repoAgg.total_pull_requests += prs;
        if (!repoAgg.contributors.has(login)) {
          repoAgg.contributors.set(login, {
            login,
            avatar_url,
            commits: 0,
            pull_requests: 0,
            contributions: 0,
            repositories: [],
            repoNames: [],
          });
        }
        const repoContributor = repoAgg.contributors.get(login)!;
        repoContributor.commits += commits;
        repoContributor.pull_requests += prs;
        repoContributor.contributions += commits + prs;
      }
    });

    // Build outputs
    const contributors = Array.from(contributorMap.values()).filter(
      c => c.commits > 0 || c.pull_requests > 0
    );
    const unique_count = contributors.length;

    const perRepo: Record<string, any> = {};
    perRepoMap.forEach((val, name) => {
      perRepo[name] = {
        total_commits: val.total_commits,
        total_pull_requests: val.total_pull_requests,
        total_issues: val.total_issues,
        contributors: Array.from(val.contributors.values()),
        issues: val.issues,
        commits: val.commits,
        pullRequests: val.pullRequests,
      };
    });

    return {
      total_commits,
      total_pull_requests,
      total_issues,
      total_contributions: total_commits + total_pull_requests,
      unique_count,
      lastFetched: Date.now(),
      contributors,
      perRepo,
    };
  } catch (err) {
    console.error('Error getting org contributor stats:', err);
    return {
      total_commits: 0,
      total_pull_requests: 0,
      total_issues: 0,
      total_contributions: 0,
      unique_count: 0,
      lastFetched: Date.now(),
      contributors: [],
      perRepo: {},
    };
  }
}
