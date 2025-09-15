export interface ProjectRecord {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    url: string;
    icon_url: string | null;
    category: string | null;
    is_active: boolean;
    owner_wallets?: string[] | null;
    owner_nft_units?: string[] | null;
    created_at: string;
    updated_at: string;
    config?: unknown;
}

export interface ContributorActivityRecord {
    contributor_id: number;
    login: string;
    repo_id: number;
    repo_name: string;
    year: number;
    commit_count: number;
    pr_count: number;
    first_activity_at: string;
    last_activity_at: string;
    commit_timestamps: string[];
    pr_timestamps: string[];
}

export interface ProjectContributorActivity {
    project_id: string;
    project_name: string;
    org_name: string;
    contributor_activity: ContributorActivityRecord[];
}

export interface ProjectsContextType {
    projects: ProjectRecord[];
    contributorActivity: ProjectContributorActivity[];
    loading: {
        projects: boolean;
        contributorActivity: boolean;
    };
    error: {
        projects: Error | null;
        contributorActivity: Error | null;
    };
    isError: {
        projects: boolean;
        contributorActivity: boolean;
    };
    lastUpdated: Date;
    refresh: () => Promise<void>;
}
