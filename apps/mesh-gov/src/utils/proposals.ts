export interface ProposalDetails {
    projectId: string;
    name: string;
    link: string;
    milestonesLink: string;
    fundingCategory: string;
    proposalBudget: string;
    status: string;
    milestonesCompleted: string;
    fundsDistributed: string;
    fundingProgress: string;
    finished?: string;
    description?: string;
}

export const PROPOSAL_OBJECTIVES: Record<string, string> = {
    '1000107': 'To guarantee and ensure sustainability of a team dedicated to maintaining and developing one of the best open-source libraries on Cardano, providing devs with something easy-to-use, fun and productive',
    '1100271': 'This proposal enables implementations not limited to Voltaire features, Hydra & Aiken integration, and data providers integrations. Including bounties for issues, features, and learning materials',
    '1200220': 'Maintenance and operations of Mesh SDK, community support and content creation, in order to onboard developers and users to the Cardano blockchain ecosystem',
    '1200147': 'We will upgrade Mesh by implementing CIP 45, WebRTC wallet connect, handle multiple serialization libs, revamp to support backend transactions building, and improve error messages to improve DevXP',
    '1200148': 'We provide hosted server instances for wallet and transactions builder by restful APIs, this allow integration and interaction to Cardano blockchain from any technology stacks and systems',
    '1300130': 'Maintenance and operations of the Mesh open source libraries and tool suits, maintaining discord dev support and core operations',
    '1300135': 'Provide tools for developers to integration Hydra to enable end-user operations like interacting with wallet, query UTXOs/balance and submit transactions and additional helpful functions',
    '1300036': 'Hosting Buidler Fest #2, building up on the great experiences of Buidler Fest #1. A 2-day event for tech-savvy Cardano builders to connect, showcase and share',
    '1300134': 'Enhancing Mesh Devtools by migrating features, developing Rust-based validation modules, and improving error handling to provide clearer feedback, helping developers debug and validate efficiently',
    '1300050': 'We build a awesome open source multisig platform with a bunch of nice features, making it easy for collectives to engage at onchain governance and more'
};

export async function getProposalDetails(projectId: string): Promise<ProposalDetails | null> {
    try {
        const response = await fetch(`/api/proposals/${projectId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch proposal details');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching proposal details:', error);
        return null;
    }
} 