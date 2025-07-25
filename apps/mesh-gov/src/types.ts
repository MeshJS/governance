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
    repoNames: string[];
}

// Context Types
export interface MeshData {
    lastFetched: number;
    meshPackagesData?: MeshPackagesApiResponse | null;
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

export interface PerRepoStats {
    total_commits: number;
    total_pull_requests: number;
    total_issues: number;
    contributors: Contributor[];
    issues: any[];
    commits: any[];
    pullRequests: any[];
}

export interface ContributorStats {
    unique_count: number;
    contributors: Contributor[];
    perRepo: Record<string, PerRepoStats>;
    total_pull_requests: number;
    total_commits: number;
    total_issues: number;
    total_contributions: number;
    lastFetched: number;
}

export interface DataContextType {
    meshData: MeshData | null;
    catalystData: CatalystContextData | null;
    drepVotingData: DRepVotingData | null;
    discordStats: DiscordStats | null;
    contributorStats: ContributorStats | null;
    isLoading: boolean;
    error: string | null;
    refetchData: () => Promise<void>;
}

export interface MeshStatsViewProps {
    filteredStats?: FilteredStats;
    discordStats?: DiscordStats;
    contributorStats?: ContributorStats;
}

// Catalyst Proposal API Types
export interface CatalystProposalVoting {
    proposalId: number;
    yes_votes_count: number;
    no_votes_count: number;
    abstain_votes_count: number;
    unique_wallets: number;
}

export interface CatalystProposal {
    id: number;
    title: string;
    budget: number;
    milestones_qty: number;
    funds_distributed: number;
    project_id: string;
    challenges: any;
    name: string;
    category: string;
    category_slug: string | null;
    fund_number: string | null;
    url: string;
    status: string;
    finished: string;
    voting: CatalystProposalVoting | null;
    milestones_completed: number;
    updated_at: string;
    isRecent?: boolean;
    timeSinceUpdate?: number;
}

export interface CatalystProposalsResponse {
    status: 'completed' | 'partial' | 'stale';
    message: string;
    hasData: boolean;
    proposals: CatalystProposal[];
    missingProjectIds: string[];
    totalRequested: number;
    totalFound: number;
}

// DRep Vote API Types
export interface DRepVote {
    vote_tx_hash: string;
    drep_id: string;
    proposal_id: string;
    proposal_tx_hash: string;
    proposal_index: number;
    vote: 'Yes' | 'No' | 'Abstain';
    block_time: string;
    meta_url: string | null;
    meta_hash: string | null;
    proposal_title: string;
    proposal_type: string;
    proposed_epoch: number | null;
    expiration_epoch: number | null;
    rationale: string;
    isRecent?: boolean;
    timeSinceVote?: number;
}

export interface DRepVotesResponse {
    status: 'completed' | 'partial' | 'stale';
    message: string;
    hasData: boolean;
    yearlyVotes: Record<string, DRepVote[]>;
    totalVotes: number;
    drepId: string;
}

export interface MonthlyDownloadRow {
    id: number;
    package_id: number;
    year: number;
    month: number;
    downloads: number;
    created_at: string;
}

export interface PackageStatsHistoryRow {
    id: number;
    package_id: number;
    recorded_at: string;
    month: string; // Format: YYYY-MM
    npm_dependents_count: number;
    github_in_any_file: number;
    github_in_repositories: number;
    github_dependents_count: number;
    package_downloads: number;
}

export interface MeshPackagesApiResponse {
    packages: Array<{
        id: number;
        name: string;
        latest_version: string;
        npm_dependents_count: number;
        github_in_any_file: number;
        github_in_repositories: number;
        github_dependents_count: number;
        last_day_downloads: number;
        last_week_downloads: number;
        last_month_downloads: number;
        last_year_downloads: number;
        last_12_months_downloads: number;
        created_at: string;
        updated_at: string;
        monthly_downloads: MonthlyDownloadRow[];
        package_stats_history: PackageStatsHistoryRow[];
    }>;
} 