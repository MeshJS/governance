export interface MilestoneData {
    number: number;
    budget: string;
    delivered: string;
    projectId: string;
    link: string;
    challenge: string;
    content: string;
    isCloseOut?: boolean;
}

export async function getMilestones(projectId: string): Promise<MilestoneData[]> {
    try {
        const response = await fetch(`/api/milestones/${projectId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error('Failed to fetch milestones');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching milestones:', error);
        return [];
    }
}

function parseMilestoneFile(content: string): Omit<MilestoneData, 'number'> | null {
    const projectIdMatch = content.match(/\|Project ID\|(\d+)\|/);
    const budgetMatch = content.match(/\|Milestone Budget\|(.*?)\|/);
    const deliveredMatch = content.match(/\|Delivered\|(.*?)\|/);
    const linkMatch = content.match(/\|Link\|\[(.*?)\]\((.*?)\)\|/);
    const challengeMatch = content.match(/\|Challenge\|(.*?)\|/);

    if (!projectIdMatch) return null;

    // Extract the main content (everything after the metadata table)
    const contentParts = content.split('# Milestone Report');
    const mainContent = contentParts[1]?.trim() || '';

    return {
        projectId: projectIdMatch[1],
        budget: budgetMatch?.[1].trim() || '',
        delivered: deliveredMatch?.[1].trim() || '',
        link: linkMatch?.[2] || '',
        challenge: challengeMatch?.[1].trim() || '',
        content: mainContent,
    };
} 