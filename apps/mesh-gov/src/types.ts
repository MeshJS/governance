export interface CatalystProject {
    projectDetails: {
        id: number;
        title: string;
        budget: number;
        milestones_qty: number;
        funds_distributed: number;
        project_id: number;
        name: string;
        category: string;
        url: string;
        status: 'In Progress' | 'Completed';
        finished: string;
        voting: {
            proposalId: number;
            yes_votes_count: number;
            no_votes_count: number | null;
            abstain_votes_count: number | null;
            unique_wallets: number;
        };
    };
    milestonesCompleted: number;
}

export interface CatalystData {
    timestamp: string;
    projects: CatalystProject[];
}

export interface GovernanceVote {
    proposalId: string;
    proposalTxHash: string;
    proposalIndex: number;
    voteTxHash: string;
    blockTime: string;
    vote: 'Yes' | 'No' | 'Abstain';
    metaUrl: string | null;
    metaHash: string | null;
    proposalTitle: string;
    proposalType: string;
    proposedEpoch: number;
    expirationEpoch: number;
    rationale: string;
}

export interface YearlyStats {
    year: number;
    yearlyTotals: {
        core: number;
        react: number;
        transaction: number;
        wallet: number;
        provider: number;
        coreCsl: number;
        coreCst: number;
    };
    monthlyDownloads: Array<{
        month: string;
        downloads: number;
        trend: '➡️' | '📈' | '📉' | '🔥';
    }>;
    githubStats: Array<{
        month: string;
        projects: number;
        files: number;
        repositories: number;
    }>;
    peakMonth: {
        name: string;
        downloads: number;
    };
    lastUpdated: string;
}

export interface ContributorRepository {
    name: string;
    commits: number;
    pull_requests: number;
    contributions: number;
    commit_timestamps: string[];
    pr_timestamps: string[];
}

export interface Contributor {
    login: string;
    avatar_url: string;
    commits: number;
    pull_requests: number;
    contributions: number;
    repositories: ContributorRepository[];
}

export interface CurrentStats {
    github: {
        core_in_package_json: number;
        core_in_any_file: number;
        core_in_repositories: number;
    };
    npm: {
        downloads: {
            core_package_last_12_months: number;
            last_day: number;
            last_week: number;
            last_month: number;
            last_year: number;
        };
        react_package_downloads: number;
        transaction_package_downloads: number;
        wallet_package_downloads: number;
        provider_package_downloads: number;
        core_csl_package_downloads: number;
        core_cst_package_downloads: number;
        latest_version: string;
        dependents_count: number;
    };
    urls: {
        npm_stat_url: string;
        npm_stat_compare_url: string;
    };
    contributors: {
        unique_count: number;
        contributors: Contributor[];
        total_pull_requests: number;
        total_commits: number;
        total_contributions: number;
    };
}

export interface ContributorsData {
    unique_count: number;
    contributors: Contributor[];
    total_pull_requests: number;
    total_commits: number;
    total_contributions: number;
    lastFetched: number;
}

// Context Types
export interface MeshData {
    currentStats: CurrentStats;
    yearlyStats: Record<number, YearlyStats>;
    lastFetched: number;
}

export interface DRepEpochInfo {
    voting_power_lovelace: string;
    total_delegators: number;
}

export interface DRepTimeline {
    epochs: Record<string, DRepEpochInfo>;
    current_epoch: number;
    total_delegators: number;
    total_amount_ada: number;
}

export interface DRepInfo {
    drepId: string;
    amount: string;
    active: boolean;
    registered: boolean;
    expires_epoch_no: number;
    last_updated: string;
}

export interface DRepDelegationData {
    timeline: DRepTimeline;
    drepInfo: DRepInfo;
}

export interface DRepVotingData {
    votes: GovernanceVote[];
    delegationData: DRepDelegationData | null;
    lastFetched: number;
}

export interface CatalystContextData {
    catalystData: CatalystData;
    lastFetched: number;
}

export interface MonthlyDownload {
    month: string;
    downloads: number;
    trend: string;
}

export interface PackageData {
    name: string;
    downloads: number;
}

export interface FilteredStats {
    packageData?: PackageData[];
    monthlyData?: YearlyStats['monthlyDownloads'];
    currentStats?: CurrentStats;
    yearlyStats?: Record<number, YearlyStats>;
}

export interface MonthlyDiscordStats {
    memberCount: number;
    totalMessages: number;
    uniquePosters: number;
}

export interface DiscordStats {
    stats: Record<string, MonthlyDiscordStats>;
    lastFetched: number;
}

export interface ContributorStats {
    year: number;
    unique_count: number;
    contributors: Array<{
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
    }>;
    total_pull_requests: number;
    total_commits: number;
    total_contributions: number;
}

export interface DataContextType {
    meshData: MeshData | null;
    catalystData: CatalystContextData | null;
    drepVotingData: DRepVotingData | null;
    discordStats: DiscordStats | null;
    contributorStats: Record<number, ContributorStats> | null;
    contributorsData: ContributorsData | null;
    isLoading: boolean;
    error: string | null;
    refetchData: () => Promise<void>;
}

export interface MeshStatsViewProps {
    currentStats: CurrentStats;
    yearlyStats: Record<number, YearlyStats>;
    filteredStats?: FilteredStats;
    discordStats?: DiscordStats;
    contributorsData?: ContributorsData;
} 