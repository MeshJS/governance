import { createClient } from '@supabase/supabase-js';
import { GovernanceProposal, GovernanceProposalResponse, VotingSummaryResponse } from '../src/types/governance';

interface ChainTipResponse {
    abs_slot: number;
    block_no: number;
    block_time: number;
    epoch: number;
    epoch_slot: number;
    hash: string;
    slot_no: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const KOIOS_API_KEY = process.env.KOIOS_API_KEY;
const KOIOS_API_URL = 'https://api.koios.rest/api/v1';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchChainTip(): Promise<ChainTipResponse[]> {
    const url = `${KOIOS_API_URL}/tip`;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (KOIOS_API_KEY) {
        headers['api-key'] = KOIOS_API_KEY;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch chain tip');
    return response.json() as Promise<ChainTipResponse[]>;
}

async function fetchGovernanceProposals(): Promise<GovernanceProposalResponse> {
    const url = `${KOIOS_API_URL}/proposal_list`;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (KOIOS_API_KEY) {
        headers['api-key'] = KOIOS_API_KEY;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch governance proposals');
    return response.json() as Promise<GovernanceProposalResponse>;
}

async function fetchVotingSummary(proposalId: string): Promise<VotingSummaryResponse> {
    const url = `${KOIOS_API_URL}/proposal_voting_summary?_proposal_id=${proposalId}`;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    if (KOIOS_API_KEY) {
        headers['api-key'] = KOIOS_API_KEY;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch voting summary');
    return response.json() as Promise<VotingSummaryResponse>;
}

async function updateGovernanceProposals() {
    try {
        // Fetch chain tip to get current slot
        const chainTip = await fetchChainTip();
        const currentSlot = chainTip[0].abs_slot;

        // First, get active proposals from Supabase
        const { data: activeProposals, error: fetchError } = await supabase
            .from('governance_proposals')
            .select('proposal_id')
            .gt('expiration', currentSlot);

        if (fetchError) throw fetchError;

        if (!activeProposals || activeProposals.length === 0) {
            console.log('No active proposals found in database');
            return;
        }

        // Fetch all governance proposals from Koios
        const allProposals = await fetchGovernanceProposals();

        // Filter only the active proposals we need to update
        const proposalsToUpdate = allProposals.filter((proposal: GovernanceProposal) =>
            activeProposals.some((active: { proposal_id: string }) => active.proposal_id === proposal.proposal_id)
        );

        // Enrich proposals with voting summaries
        const enrichedProposals = await Promise.all(
            proposalsToUpdate.map(async (proposal: GovernanceProposal) => {
                const votingSummary = await fetchVotingSummary(proposal.proposal_id);
                return {
                    ...proposal,
                    voting_summary: votingSummary,
                    last_updated_slot: currentSlot
                };
            })
        );

        // Update Supabase
        const { error: updateError } = await supabase
            .from('governance_proposals')
            .upsert(enrichedProposals, { onConflict: 'proposal_id' });

        if (updateError) throw updateError;
        console.log(`Successfully updated ${enrichedProposals.length} active governance proposals`);
    } catch (error) {
        console.error('Error updating governance proposals:', error);
        process.exit(1);
    }
}

updateGovernanceProposals(); 