import { CatalystProposal, CatalystProject, CatalystData, MilestoneContent } from '../types';



/**
 * Extracts all milestones from catalyst projects
 */
export function extractAllMilestonesFromProjects(projects: CatalystProject[]): MilestoneContent[] {
    const allMilestones: MilestoneContent[] = [];

    projects.forEach(project => {
        if (project.projectDetails.milestones_content) {
            const projectMilestones = Object.values(project.projectDetails.milestones_content);
            allMilestones.push(...projectMilestones);
        }
    });

    return allMilestones;
}

/**
 * Transforms a CatalystProposal from the API to the CatalystProject structure used by the UI
 */
export function transformCatalystProposalToProject(proposal: CatalystProposal): CatalystProject {
    return {
        projectDetails: {
            id: proposal.id,
            title: proposal.title,
            budget: proposal.budget,
            milestones_qty: proposal.milestones_qty,
            funds_distributed: proposal.funds_distributed,
            project_id: proposal.project_id,
            name: proposal.name,
            category: proposal.category,
            url: proposal.url,
            status: proposal.status as 'In Progress' | 'Completed',
            finished: proposal.finished,
            milestones_content: proposal.milestones_content || null,
            voting: proposal.voting ? {
                proposalId: proposal.voting.proposalId,
                yes_votes_count: proposal.voting.yes_votes_count,
                no_votes_count: proposal.voting.no_votes_count,
                abstain_votes_count: proposal.voting.abstain_votes_count,
                unique_wallets: proposal.voting.unique_wallets
            } : {
                proposalId: 0,
                yes_votes_count: 0,
                no_votes_count: null,
                abstain_votes_count: null,
                unique_wallets: 0
            }
        },
        milestonesCompleted: proposal.milestones_completed
    };
}

/**
 * Transforms an array of CatalystProposal from the API to CatalystData structure
 */
export function transformCatalystProposalsToData(proposals: CatalystProposal[]): CatalystData {
    const projects = proposals.map(transformCatalystProposalToProject);

    return {
        timestamp: new Date().toISOString(),
        projects
    };
}

/**
 * Fetches catalyst proposals via API and transforms them to the expected format
 */
export async function fetchCatalystProposalsViaAPI(projectIds: string[]): Promise<CatalystData | null> {
    try {
        const projectIdsParam = projectIds.join(',');
        const url = new URL('/api/catalyst/proposals', window.location.origin);
        url.searchParams.set('projectIds', projectIdsParam);

        //console.log(`Fetching catalyst proposals for project IDs: ${projectIdsParam}`);
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`Failed to fetch catalyst proposals: ${response.status} ${response.statusText}`);
        }

        const apiResponse = await response.json();
        //console.log('API response:', apiResponse);

        if (!apiResponse.hasData || apiResponse.proposals.length === 0) {
            console.warn('No catalyst proposals found via API');
            return null;
        }

        //console.log(`Transforming ${apiResponse.proposals.length} proposals`);
        const transformedData = transformCatalystProposalsToData(apiResponse.proposals);
        //console.log('Transformed data:', transformedData);

        return transformedData;
    } catch (error) {
        console.error('Error fetching catalyst proposals via API:', error);
        return null;
    }
} 