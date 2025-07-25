import { SearchFilterConfig } from '../components/SearchFilterBar';
import { CatalystProject, GovernanceVote } from '../types';

// Helper functions to generate filter options dynamically from data
export const getUniqueValues = <T, K extends keyof T>(items: T[], key: K): T[K][] => {
    const values = items.map(item => item[key]);
    return [...new Set(values)];
};

export const extractFundingRounds = (projects: CatalystProject[]): string[] => {
    const fundingRounds = projects.map(project =>
        project.projectDetails.category.substring(0, 3)
    );
    return [...new Set(fundingRounds)];
};

export const getProposalTypes = (votes: GovernanceVote[]): string[] => {
    return [...new Set(votes.map(vote => vote.proposalType))];
};

// Dashboard page - search across all data (this one is static by nature)
export const dashboardFilterConfig: SearchFilterConfig = {
    placeholder: 'Search across votes, proposals, and stats...',
    filters: [
        {
            id: 'type',
            label: 'Result Type',
            options: [
                { label: 'DRep Votes', value: 'vote' },
                { label: 'Catalyst Proposals', value: 'proposal' }
            ]
        }
    ]
};

// Dynamic filter configuration generators
export const generateDrepVotingFilterConfig = (votes: GovernanceVote[]): SearchFilterConfig => {
    // Get unique proposal types from votes data
    const proposalTypes = getProposalTypes(votes);

    return {
        placeholder: 'Search votes by title, proposal ID, rationale, or type...',
        filters: [
            {
                id: 'vote',
                label: 'Vote Decision',
                options: [
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                    { label: 'Abstain', value: 'Abstain' }
                ]
            },
            {
                id: 'proposalType',
                label: 'Proposal Type',
                options: proposalTypes.map(type => ({
                    label: type,
                    value: type
                }))
            }
        ]
    };
};

export const generateCatalystProposalsFilterConfig = (projects: CatalystProject[]): SearchFilterConfig => {
    // Extract unique statuses and funding rounds from projects data
    const statuses = [...new Set(projects.map(project => project.projectDetails.status))];
    const fundingRounds = extractFundingRounds(projects);

    return {
        placeholder: 'Search proposals by title, project ID, funding round, or status...',
        filters: [
            {
                id: 'status',
                label: 'Status',
                options: statuses.map(status => ({
                    label: status,
                    value: status
                }))
            },
            {
                id: 'fundingRound',
                label: 'Funding Round',
                options: fundingRounds.map(round => ({
                    label: round,
                    value: round
                }))
            }
        ]
    };
};

// Search helper functions for each data type
export const filterVotes = (votes: GovernanceVote[], searchTerm: string, filters: Record<string, string>): GovernanceVote[] => {
    // Don't filter if no search term and no filters
    if (!searchTerm && Object.keys(filters).length === 0) return votes;

    return votes.filter(vote => {
        // Search term filter - check across multiple fields
        const searchMatch = !searchTerm ||
            vote.proposalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vote.proposalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vote.rationale.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vote.proposalId.toLowerCase().includes(searchTerm.toLowerCase());

        // Apply individual filters
        const voteMatch = !filters.vote || vote.vote === filters.vote;
        const typeMatch = !filters.proposalType || vote.proposalType === filters.proposalType;

        return searchMatch && voteMatch && typeMatch;
    });
};

export const filterProposals = (projects: CatalystProject[], searchTerm: string, filters: Record<string, string>): CatalystProject[] => {
    // Don't filter if no search term and no filters
    if (!searchTerm && Object.keys(filters).length === 0) return projects;

    return projects.filter(project => {
        // Search term filter - check across multiple fields
        const searchMatch = !searchTerm ||
            project.projectDetails.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.projectDetails.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.projectDetails.project_id.toString().includes(searchTerm);

        // Extract funding round from category (first 3 characters)
        const fundingRound = project.projectDetails.category.substring(0, 3);

        // Apply individual filters
        const statusMatch = !filters.status || project.projectDetails.status === filters.status;
        const fundingRoundMatch = !filters.fundingRound || fundingRound === filters.fundingRound;

        return searchMatch && statusMatch && fundingRoundMatch;
    });
};
