-- 1) New MV: contributor_activity_yearly_mat
CREATE MATERIALIZED VIEW IF NOT EXISTS contributor_activity_yearly_mat AS
WITH
  commits_cte AS (
    SELECT
      c.author_id                         AS contributor_id,
      c.repo_id,
      date_part('year', c.date)::int      AS year,
      COUNT(*)                            AS commit_count,
      MIN(c.date)                         AS first_commit_at,
      MAX(c.date)                         AS last_commit_at,
      ARRAY_AGG(c.date ORDER BY c.date)   AS commit_timestamps
    FROM commits c
    WHERE c.date IS NOT NULL
    GROUP BY 1,2,3
  ),
  prs_cte AS (
    SELECT
      pr.user_id                          AS contributor_id,
      pr.repo_id,
      date_part('year', pr.merged_at)::int AS year,
      COUNT(*)                            AS pr_count,
      MIN(pr.merged_at)                   AS first_pr_at,
      MAX(pr.merged_at)                   AS last_pr_at,
      ARRAY_AGG(pr.merged_at ORDER BY pr.merged_at) AS pr_timestamps
    FROM pull_requests pr
    WHERE pr.merged_at IS NOT NULL
    GROUP BY 1,2,3
  ),
  merged AS (
    SELECT
      COALESCE(c.contributor_id, p.contributor_id) AS contributor_id,
      COALESCE(c.repo_id,        p.repo_id)        AS repo_id,
      COALESCE(c.year,           p.year)           AS year,
      COALESCE(c.commit_count, 0)                  AS commit_count,
      COALESCE(p.pr_count, 0)                      AS pr_count,
      COALESCE(c.first_commit_at, p.first_pr_at)   AS first_activity_at,
      COALESCE(c.last_commit_at,  p.last_pr_at)    AS last_activity_at,
      COALESCE(c.commit_timestamps, '{}'::timestamptz[]) AS commit_timestamps,
      COALESCE(p.pr_timestamps,   '{}'::timestamptz[])   AS pr_timestamps
    FROM commits_cte c
    FULL JOIN prs_cte p
      ON p.contributor_id = c.contributor_id
     AND p.repo_id        = c.repo_id
     AND p.year           = c.year
  )
SELECT
  m.contributor_id,
  u.login,
  m.repo_id,
  r.name AS repo_name,
  m.year,
  m.commit_count,
  m.pr_count,
  m.first_activity_at,
  m.last_activity_at,
  m.commit_timestamps,
  m.pr_timestamps
FROM merged m
JOIN contributors u ON u.id = m.contributor_id
JOIN github_repos r ON r.id = m.repo_id;

-- 2) Deterministic indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS contributor_activity_yearly_key_idx
  ON contributor_activity_yearly_mat (contributor_id, repo_id, year);

-- Filter by actor quickly
CREATE INDEX IF NOT EXISTS contributor_activity_yearly_contributor_idx
  ON contributor_activity_yearly_mat (contributor_id);

-- Filter by repo quickly
CREATE INDEX IF NOT EXISTS contributor_activity_yearly_repo_idx
  ON contributor_activity_yearly_mat (repo_id);

-- Time-window filters (first/last activity)
CREATE INDEX IF NOT EXISTS contributor_activity_yearly_first_last_idx
  ON contributor_activity_yearly_mat (first_activity_at, last_activity_at);

-- 3) pg_cron schedule for nightly refresh (CONCURRENTLY so reads keep working)
SELECT cron.schedule(
  'refresh_contributor_activity_yearly',
  '0 2 * * *',
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_activity_yearly_mat; $$
);

-- 4) Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_activity_yearly_mat;
