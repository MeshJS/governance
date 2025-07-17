-- Mesh SDK Stats Database Schema

-- Packages table - stores package information and download statistics
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    latest_version VARCHAR(50),
    npm_dependents_count INTEGER DEFAULT 0,
    github_in_any_file INTEGER DEFAULT 0,
    github_in_repositories INTEGER DEFAULT 0,
    github_dependents_count INTEGER DEFAULT 0, -- NEW: cheerio-scraped dependents count
    last_day_downloads INTEGER DEFAULT 0,
    last_week_downloads INTEGER DEFAULT 0,
    last_month_downloads INTEGER DEFAULT 0,
    last_year_downloads INTEGER DEFAULT 0,
    last_12_months_downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GitHub repositories table - using GitHub repo ID as primary key
CREATE TABLE github_repos (
    id BIGINT PRIMARY KEY, -- GitHub repository ID
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    private BOOLEAN DEFAULT FALSE,
    fork BOOLEAN DEFAULT FALSE,
    html_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contributors table
CREATE TABLE contributors (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commits table: detailed commit info, related to contributors and repos
CREATE TABLE commits (
    id SERIAL PRIMARY KEY,
    sha VARCHAR(64) NOT NULL UNIQUE,
    repo_id BIGINT NOT NULL REFERENCES github_repos(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES contributors(id),
    committer_id INTEGER REFERENCES contributors(id),
    message TEXT,
    date TIMESTAMP WITH TIME ZONE,
    additions INTEGER,
    deletions INTEGER,
    total_changes INTEGER,
    files_changed INTEGER,
    is_merge BOOLEAN,
    parent_shas VARCHAR(64)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pull Requests table: detailed PR info, related to contributors and repos
CREATE TABLE pull_requests (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL,
    repo_id BIGINT NOT NULL REFERENCES github_repos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES contributors(id),
    merged_by_id INTEGER REFERENCES contributors(id),
    title TEXT,
    body TEXT,
    state VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    merged_at TIMESTAMP WITH TIME ZONE,
    additions INTEGER,
    deletions INTEGER,
    changed_files INTEGER,
    commits_count INTEGER,
    UNIQUE(repo_id, number)
);

-- PR Reviewers table: links PRs to reviewers (contributors)
CREATE TABLE pr_reviewers (
    id SERIAL PRIMARY KEY,
    pr_id INTEGER NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES contributors(id),
    UNIQUE(pr_id, reviewer_id)
);

-- PR Assignees table: links PRs to assignees (contributors)
CREATE TABLE pr_assignees (
    id SERIAL PRIMARY KEY,
    pr_id INTEGER NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
    assignee_id INTEGER NOT NULL REFERENCES contributors(id),
    UNIQUE(pr_id, assignee_id)
);

-- PR Labels table: links PRs to labels
CREATE TABLE pr_labels (
    id SERIAL PRIMARY KEY,
    pr_id INTEGER NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
    label_name VARCHAR(255) NOT NULL,
    UNIQUE(pr_id, label_name)
);

-- PR <-> Commit link table: links PRs to their commits
CREATE TABLE pr_commits (
    id SERIAL PRIMARY KEY,
    pr_id INTEGER NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
    commit_sha VARCHAR(64) NOT NULL,
    UNIQUE(pr_id, commit_sha)
);

-- Issues table
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    number INTEGER NOT NULL,
    repo_id BIGINT NOT NULL REFERENCES github_repos(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES contributors(id),
    title TEXT,
    body TEXT,
    state VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    comments_count INTEGER,
    is_pull_request BOOLEAN DEFAULT FALSE,
    milestone_title TEXT,
    UNIQUE(repo_id, number)
);

-- Issue Assignees table
CREATE TABLE issue_assignees (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    assignee_id INTEGER NOT NULL REFERENCES contributors(id),
    UNIQUE(issue_id, assignee_id)
);

-- Issue Labels table
CREATE TABLE issue_labels (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    label_name VARCHAR(255) NOT NULL,
    UNIQUE(issue_id, label_name)
);


-- Package stats history table - for tracking stats over time
CREATE TABLE package_stats_history (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    npm_dependents_count INTEGER DEFAULT 0,
    github_in_any_file INTEGER DEFAULT 0,
    github_in_repositories INTEGER DEFAULT 0,
    github_dependents_count INTEGER DEFAULT 0,
    package_downloads INTEGER DEFAULT 0,
    UNIQUE(package_id, month)
);

-- Monthly downloads table - for tracking monthly download data
CREATE TABLE monthly_downloads (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    downloads INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(package_id, year, month)
);

-- Indexes for better query performance
CREATE INDEX idx_packages_name ON packages(name);
CREATE INDEX idx_github_repos_name ON github_repos(name);
CREATE INDEX idx_contributors_login ON contributors(login);
CREATE INDEX idx_package_stats_history_package_id ON package_stats_history(package_id);
CREATE INDEX idx_package_stats_history_recorded_at ON package_stats_history(recorded_at);
CREATE INDEX idx_monthly_downloads_package_id ON monthly_downloads(package_id);
CREATE INDEX idx_monthly_downloads_year_month ON monthly_downloads(year, month);

-- Insert initial packages
INSERT INTO packages (name) VALUES 
    ('@meshsdk/core'),
    ('@meshsdk/react'),
    ('@meshsdk/transaction'),
    ('@meshsdk/wallet'),
    ('@meshsdk/provider'),
    ('@meshsdk/core-csl'),
    ('@meshsdk/core-cst')
ON CONFLICT (name) DO NOTHING; 