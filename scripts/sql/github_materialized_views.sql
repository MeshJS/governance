-- 1) contributor_summary_mat
CREATE MATERIALIZED VIEW IF NOT EXISTS contributor_summary_mat AS
WITH
  commit_stats AS (
    SELECT author_id AS contributor_id, COUNT(*) AS commits_count
    FROM commits
    GROUP BY author_id
  ),
  pr_stats AS (
    SELECT contributor_id, COUNT(*) AS prs_count
    FROM (
      SELECT user_id AS contributor_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
      UNION ALL
      SELECT merged_by_id AS contributor_id
      FROM pull_requests
      WHERE merged_at IS NOT NULL
    ) pr_union
    GROUP BY contributor_id
  ),
  repos_stats AS (
    SELECT contributor_id, COUNT(DISTINCT repo_id) AS repos_count
    FROM (
      SELECT author_id AS contributor_id, repo_id FROM commits
      UNION ALL
      SELECT user_id AS contributor_id, repo_id FROM pull_requests WHERE merged_at IS NOT NULL
      UNION ALL
      SELECT merged_by_id AS contributor_id, repo_id FROM pull_requests WHERE merged_at IS NOT NULL
    ) all_union
    GROUP BY contributor_id
  )
SELECT
  c.id AS contributor_id,
  c.login,
  c.avatar_url,
  COALESCE(cs.commits_count,0) AS commits_count,
  COALESCE(ps.prs_count,0)     AS prs_count,
  COALESCE(rs.repos_count,0)   AS repos_count
FROM contributors c
LEFT JOIN commit_stats cs ON cs.contributor_id = c.id
LEFT JOIN pr_stats ps     ON ps.contributor_id = c.id
LEFT JOIN repos_stats rs  ON rs.contributor_id = c.id;

CREATE UNIQUE INDEX IF NOT EXISTS contributor_summary_mat_contributor_id_idx
  ON contributor_summary_mat(contributor_id);

-- 2) contributor_repo_activity_mat
CREATE MATERIALIZED VIEW IF NOT EXISTS contributor_repo_activity_mat AS
WITH
  commit_stats AS (
    SELECT author_id AS contributor_id, repo_id, COUNT(*) AS commits_in_repo
    FROM commits
    GROUP BY author_id, repo_id
  ),
  pr_stats AS (
    SELECT contributor_id, repo_id, COUNT(*) AS prs_in_repo
    FROM (
      SELECT user_id AS contributor_id, repo_id FROM pull_requests WHERE merged_at IS NOT NULL
      UNION ALL
      SELECT merged_by_id AS contributor_id, repo_id FROM pull_requests WHERE merged_at IS NOT NULL
    ) pr_union
    GROUP BY contributor_id, repo_id
  )
SELECT
  COALESCE(c.contributor_id, p.contributor_id) AS contributor_id,
  COALESCE(c.repo_id, p.repo_id)               AS repo_id,
  gr.name                                      AS repo_name,
  COALESCE(c.commits_in_repo, 0)               AS commits_in_repo,
  COALESCE(p.prs_in_repo, 0)                   AS prs_in_repo
FROM commit_stats c
FULL JOIN pr_stats p
  ON c.contributor_id = p.contributor_id
 AND c.repo_id        = p.repo_id
JOIN github_repos gr
  ON gr.id = COALESCE(c.repo_id, p.repo_id);

CREATE UNIQUE INDEX IF NOT EXISTS contributor_repo_activity_mat_contributor_repo_idx
  ON contributor_repo_activity_mat(contributor_id, repo_id);

-- 3) contributor_timestamps_mat
CREATE MATERIALIZED VIEW IF NOT EXISTS contributor_timestamps_mat AS
WITH
  commit_timestamps AS (
    SELECT
      c.author_id AS contributor_id,
      c.repo_id,
      gr.name AS repo_name,
      c.date AS timestamp,
      'commit' AS activity_type,
      ROW_NUMBER() OVER (
        PARTITION BY c.author_id, c.repo_id, c.date
        ORDER BY c.id
      ) AS row_num
    FROM commits c
    JOIN github_repos gr ON gr.id = c.repo_id
    WHERE c.date IS NOT NULL
  ),
  pr_timestamps AS (
    SELECT
      pr.user_id AS contributor_id,
      pr.repo_id,
      gr.name AS repo_name,
      pr.merged_at AS timestamp,
      'pr' AS activity_type,
      ROW_NUMBER() OVER (
        PARTITION BY pr.user_id, pr.repo_id, pr.merged_at
        ORDER BY pr.id
      ) AS row_num
    FROM pull_requests pr
    JOIN github_repos gr ON gr.id = pr.repo_id
    WHERE pr.merged_at IS NOT NULL
  )
SELECT contributor_id, repo_id, repo_name, timestamp, activity_type, row_num
FROM (
  SELECT * FROM commit_timestamps
  UNION ALL
  SELECT * FROM pr_timestamps
) all_activities
ORDER BY contributor_id, repo_name, timestamp, row_num;

-- deterministic names for indexes so repeated migrations are idempotent
CREATE UNIQUE INDEX IF NOT EXISTS contributor_timestamps_mat_unique_idx
  ON contributor_timestamps_mat(contributor_id, repo_name, timestamp, activity_type, row_num);
CREATE INDEX IF NOT EXISTS contributor_timestamps_mat_contributor_repo_idx
  ON contributor_timestamps_mat(contributor_id, repo_name);
CREATE INDEX IF NOT EXISTS contributor_timestamps_mat_activity_type_idx
  ON contributor_timestamps_mat(activity_type);

-- 4) pg_cron schedules (note: no "refresh_commit_timeseries")
SELECT cron.schedule(
  'refresh_contributor_summary', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_summary_mat; $$
);
SELECT cron.schedule(
  'refresh_repo_activity', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_repo_activity_mat; $$
);
SELECT cron.schedule(
  'refresh_timestamps', '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_timestamps_mat; $$
);

-- 5) Manual refresh helper (no timeseries MV here)
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_summary_mat;
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_repo_activity_mat;
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_timestamps_mat;

-- 6) Performance indexes for watermarks and API lookups
-- Commits fast lookup by repo/date
CREATE INDEX IF NOT EXISTS commits_repo_date_desc_idx ON commits (repo_id, date DESC);
-- Pull requests fast lookup by repo/updated_at
CREATE INDEX IF NOT EXISTS pull_requests_repo_updated_desc_idx ON pull_requests (repo_id, updated_at DESC);
-- Issues fast lookup by repo/is_pull_request/updated_at
CREATE INDEX IF NOT EXISTS issues_repo_ispr_updated_desc_idx ON issues (repo_id, is_pull_request, updated_at DESC);