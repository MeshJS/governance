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
    }>;
    peakMonth: {
        name: string;
        downloads: number;
    };
    lastUpdated: string;
}

export interface ContributorRepository {
    name: string;
    contributions: number;
}

export interface Contributor {
    login: string;
    avatar_url: string;
    contributions: number;
    repositories: ContributorRepository[];
}

export interface CurrentStats {
    github: {
        core_in_package_json: number;
        core_in_any_file: number;
    };
    npm: {
        downloads: {
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
    };
}

// Context Types
export interface MeshData {
    currentStats: CurrentStats;
    yearlyStats: Record<number, YearlyStats>;
    lastFetched: number;
}

export interface DRepVotingData {
    votes: GovernanceVote[];
    lastFetched: number;
}

export interface CatalystContextData {
    catalystData: CatalystData;
    lastFetched: number;
}

export interface DataContextType {
    meshData: MeshData | null;
    catalystData: CatalystContextData | null;
    drepVotingData: DRepVotingData | null;
    isLoading: boolean;
    error: string | null;
    refetchData: () => Promise<void>;
} 