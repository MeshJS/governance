-- 1) contributor_summary_mat
CREATE MATERIALIZED VIEW contributor_summary_mat AS
WITH
  -- total commits per contributor
  commit_stats AS (
    SELECT
      author_id         AS contributor_id,
      COUNT(*)          AS commits_count
    FROM commits
    GROUP BY author_id
  ),
  -- total merged‑PR contributions per contributor (opens + merges)
  pr_stats AS (
    SELECT
      contributor_id,
      COUNT(*)          AS prs_count
    FROM (
      SELECT user_id        AS contributor_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
      UNION ALL
      SELECT merged_by_id   AS contributor_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
    ) pr_union
    GROUP BY contributor_id
  ),
  -- distinct repos contributed to (via commits OR merged PRs)
  repos_stats AS (
    SELECT
      contributor_id,
      COUNT(DISTINCT repo_id) AS repos_count
    FROM (
      -- commit repos
      SELECT author_id    AS contributor_id, repo_id
      FROM commits
      UNION ALL
      -- PR‑opened repos
      SELECT user_id      AS contributor_id, repo_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
      UNION ALL
      -- PR‑merged repos
      SELECT merged_by_id AS contributor_id, repo_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
    ) all_union
    GROUP BY contributor_id
  )
SELECT
  c.id                          AS contributor_id,
  c.login,
  c.avatar_url,
  COALESCE(cs.commits_count,0)  AS commits_count,
  COALESCE(ps.prs_count,0)      AS prs_count,
  COALESCE(rs.repos_count,0)    AS repos_count
FROM contributors c
LEFT JOIN commit_stats cs  ON cs.contributor_id = c.id
LEFT JOIN pr_stats     ps  ON ps.contributor_id = c.id
LEFT JOIN repos_stats  rs  ON rs.contributor_id = c.id
;
-- index so we can REFRESH CONCURRENTLY
CREATE UNIQUE INDEX ON contributor_summary_mat(contributor_id);


-- 2) contributor_commit_timeseries_mat
-- (unchanged—this still exactly matches your commits API)
CREATE MATERIALIZED VIEW contributor_commit_timeseries_mat AS
SELECT
  author_id                         AS contributor_id,
  date_trunc('day', date)           AS bucket,
  COUNT(*)                          AS commits_in_bucket
FROM commits
GROUP BY author_id, bucket
;
CREATE UNIQUE INDEX ON contributor_commit_timeseries_mat(contributor_id, bucket);


-- 3) contributor_repo_activity_mat
CREATE MATERIALIZED VIEW contributor_repo_activity_mat AS
WITH
  -- per‑repo commit counts
  commit_stats AS (
    SELECT
      author_id       AS contributor_id,
      repo_id,
      COUNT(*)        AS commits_in_repo
    FROM commits
    GROUP BY author_id, repo_id
  ),
  -- per‑repo merged‑PR counts (opens + merges)
  pr_stats AS (
    SELECT
      contributor_id,
      repo_id,
      COUNT(*)        AS prs_in_repo
    FROM (
      SELECT user_id      AS contributor_id, repo_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
      UNION ALL
      SELECT merged_by_id AS contributor_id, repo_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
    ) pr_union
    GROUP BY contributor_id, repo_id
  )
SELECT
  COALESCE(c.contributor_id, p.contributor_id) AS contributor_id,
  COALESCE(c.repo_id,          p.repo_id)        AS repo_id,
  gr.name                                        AS repo_name,
  COALESCE(c.commits_in_repo,  0)                 AS commits_in_repo,
  COALESCE(p.prs_in_repo,      0)                 AS prs_in_repo
FROM commit_stats c
FULL  JOIN pr_stats     p
  ON c.contributor_id = p.contributor_id
 AND c.repo_id        = p.repo_id
JOIN github_repos gr
  ON gr.id = COALESCE(c.repo_id, p.repo_id)
;
CREATE UNIQUE INDEX ON contributor_repo_activity_mat(contributor_id, repo_id);


-- 4) contributor_timestamps_mat (NEW)
-- This view provides commit and PR timestamps per contributor and repo
CREATE MATERIALIZED VIEW contributor_timestamps_mat AS
WITH
  -- Commit timestamps with contributor and repo info
  commit_timestamps AS (
    SELECT
      c.author_id AS contributor_id,
      c.repo_id,
      gr.name AS repo_name,
      c.date AS timestamp,
      'commit' AS activity_type,
      ROW_NUMBER() OVER (PARTITION BY c.author_id, c.repo_id, c.date ORDER BY c.id) AS row_num
    FROM commits c
    JOIN github_repos gr ON gr.id = c.repo_id
    WHERE c.date IS NOT NULL
  ),
  -- PR timestamps with contributor and repo info
  pr_timestamps AS (
    SELECT
      pr.user_id AS contributor_id,
      pr.repo_id,
      gr.name AS repo_name,
      pr.merged_at AS timestamp,
      'pr' AS activity_type,
      ROW_NUMBER() OVER (PARTITION BY pr.user_id, pr.repo_id, pr.merged_at ORDER BY pr.id) AS row_num
    FROM pull_requests pr
    JOIN github_repos gr ON gr.id = pr.repo_id
    WHERE pr.merged_at IS NOT NULL
  )
SELECT
  contributor_id,
  repo_id,
  repo_name,
  timestamp,
  activity_type,
  row_num
FROM (
  SELECT * FROM commit_timestamps
  UNION ALL
  SELECT * FROM pr_timestamps
) all_activities
ORDER BY contributor_id, repo_name, timestamp, row_num
;
-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX ON contributor_timestamps_mat(contributor_id, repo_name, timestamp, activity_type, row_num);
-- Additional indexes for performance
CREATE INDEX ON contributor_timestamps_mat(contributor_id, repo_name);
CREATE INDEX ON contributor_timestamps_mat(activity_type);


-- 5) pg_cron jobs (if you still want nightly refresh at 02:00 UTC)
SELECT cron.schedule(
  'refresh_contributor_summary', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_summary_mat; $$
);
SELECT cron.schedule(
  'refresh_commit_timeseries', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_commit_timeseries_mat; $$
);
SELECT cron.schedule(
  'refresh_repo_activity', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_repo_activity_mat; $$
);
SELECT cron.schedule(
  'refresh_timestamps', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_timestamps_mat; $$
);


-- and to refresh all four at once:
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_summary_mat;
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_commit_timeseries_mat;
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_repo_activity_mat;
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_timestamps_mat;

