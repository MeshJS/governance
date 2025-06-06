import { createClient } from '@supabase/supabase-js';
import { GovernanceProposal, GovernanceProposalResponse, VotingSummaryResponse } from './types/governance';

interface ChainTipResponse {
    abs_slot: number;
    block_time: number;
    epoch_no: number;
    epoch_slot: number;
    hash: string;
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

async function fetchMetadataFromUrl(url: string): Promise<any> {
    try {
        // Handle IPFS URLs
        if (url.startsWith('ipfs://')) {
            const ipfsHash = url.replace('ipfs://', '');
            url = `https://ipfs.io/ipfs/${ipfsHash}`;
        }

        console.log(`Fetching metadata from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch metadata from ${url}: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        console.log(`Successfully fetched metadata from ${url}`);
        return data;
    } catch (error) {
        console.error(`Error fetching metadata from ${url}:`, error);
        return null;
    }
}

async function updateGovernanceProposals() {
    try {
        // Fetch chain tip to get current slot
        const chainTip = await fetchChainTip();
        const currentEpoch = chainTip[0].epoch_no;

        // First, get active proposals from Supabase
        const { data: activeProposals, error: fetchError } = await supabase
            .from('governance_proposals')
            .select('proposal_id')
            .gt('expiration', currentEpoch);

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

        // Enrich proposals with voting summaries and metadata
        const enrichedProposals = await Promise.all(
            proposalsToUpdate.map(async (proposal: GovernanceProposal) => {
                const votingSummary = await fetchVotingSummary(proposal.proposal_id);

                // If meta_json is null or empty and meta_url exists, fetch metadata
                if ((!proposal.meta_json || Object.keys(proposal.meta_json).length === 0) && proposal.meta_url) {
                    console.log(`Proposal ${proposal.proposal_id} has meta_url but no meta_json, fetching metadata...`);
                    const metadata = await fetchMetadataFromUrl(proposal.meta_url);
                    if (metadata) {
                        console.log(`Successfully fetched metadata for proposal ${proposal.proposal_id}`);
                        proposal.meta_json = metadata;
                    } else {
                        console.log(`Failed to fetch metadata for proposal ${proposal.proposal_id}`);
                    }
                }

                return {
                    ...proposal,
                    ...votingSummary[0],
                    updated_at: new Date().toISOString()
                };
            })
        );

        // Update Supabase
        const { error: updateError } = await supabase
            .from('governance_proposals')
            .upsert(enrichedProposals, { onConflict: 'proposal_id' });

        if (updateError) {
            console.error('Error updating proposals in Supabase:', updateError);
            throw updateError;
        }
        console.log(`Successfully updated ${enrichedProposals.length} active governance proposals`);
    } catch (error) {
        console.error('Error updating governance proposals:', error);
        process.exit(1);
    }
}

updateGovernanceProposals(); 