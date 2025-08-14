import config from '../../config';

export interface ContributorsAllResponse {
    contributorSummary: any[];
    contributorRepoActivity: any[];
    contributorTimestamps: Record<string, Record<string, { commit_timestamps: string[]; pr_timestamps: string[] }>>;
}

// In-memory de-duplication and short-lived cache to prevent repeated calls
let inFlight: Promise<ContributorsAllResponse> | null = null;
let lastValue: ContributorsAllResponse | null = null;
let lastFetchedAt: number | null = null;

// Keep a short TTL to coalesce bursts of requests; long-term caching handled by localStorage in context
const IN_MEMORY_TTL_MS = 60 * 1000;

export const getContributorsAllOnce = async (
    organizationName: string = config.mainOrganization.name
): Promise<ContributorsAllResponse> => {
    const now = Date.now();
    if (lastValue && lastFetchedAt && now - lastFetchedAt < IN_MEMORY_TTL_MS) {
        return lastValue;
    }
    if (inFlight) return inFlight;

    inFlight = (async () => {
        const response = await fetch(`/api/github/contributors-all?org=${encodeURIComponent(organizationName)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as ContributorsAllResponse;
        lastValue = data;
        lastFetchedAt = Date.now();
        return data;
    })()
        .finally(() => {
            // Clear inFlight after completion to allow refresh beyond TTL
            inFlight = null;
        });

    return inFlight;
};


