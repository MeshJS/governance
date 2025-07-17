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

        const text = await response.text();
        console.log(`Raw response from ${url}:`, text.substring(0, 200) + '...'); // Log first 200 chars

        try {
            const data = JSON.parse(text);
            console.log(`Successfully parsed JSON from ${url}`);
            return data;
        } catch (parseError) {
            console.error(`Failed to parse JSON from ${url}:`, parseError);
            return null;
        }
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

        // Fetch all governance proposals from Koios
        const allProposals = await fetchGovernanceProposals();
        console.log(`Fetched ${allProposals.length} total proposals from Koios`);

        // Deduplicate proposals by proposal_id (in case the API returns duplicates)
        const uniqueProposals = allProposals.filter((proposal: GovernanceProposal, index: number, self: GovernanceProposal[]) =>
            index === self.findIndex(p => p.proposal_id === proposal.proposal_id)
        );
        console.log(`After deduplication: ${uniqueProposals.length} unique proposals`);

        // Get all proposal IDs from Supabase
        const { data: existingProposals, error: fetchExistingError } = await supabase
            .from('governance_proposals')
            .select('proposal_id');

        if (fetchExistingError) throw fetchExistingError;

        const existingProposalIds = new Set(existingProposals?.map(p => p.proposal_id) || []);
        console.log(`Found ${existingProposalIds.size} existing proposals in Supabase`);

        // Find missing proposals
        const missingProposals = uniqueProposals.filter((proposal: GovernanceProposal) =>
            !existingProposalIds.has(proposal.proposal_id)
        );

        console.log(`Found ${missingProposals.length} missing proposals`);

        // Process all proposals (both missing and existing) in a single operation
        console.log('Processing all proposals...');

        const allProposalsToProcess = uniqueProposals.filter((proposal: GovernanceProposal) => {
            // Include proposals that are missing OR are active (not expired)
            return !existingProposalIds.has(proposal.proposal_id) ||
                proposal.expiration > currentEpoch;
        });

        console.log(`Processing ${allProposalsToProcess.length} proposals (missing + active)`);

        // Enrich all proposals with voting summaries and metadata
        const enrichedProposals = await Promise.all(
            allProposalsToProcess.map(async (proposal: GovernanceProposal) => {
                const votingSummary = await fetchVotingSummary(proposal.proposal_id);

                // Fetch metadata if meta_url exists and we don't have it yet
                if (proposal.meta_url && (!proposal.meta_json || Object.keys(proposal.meta_json).length === 0)) {
                    console.log(`Fetching metadata for proposal ${proposal.proposal_id} from: ${proposal.meta_url}`);
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
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            })
        );

        // Log the final data being sent to Supabase
        console.log('Sample of enriched proposal:', JSON.stringify(enrichedProposals[0], null, 2).substring(0, 200) + '...');

        // Upsert all proposals to Supabase (insert new ones, update existing ones)
        const { error: upsertError } = await supabase
            .from('governance_proposals')
            .upsert(enrichedProposals, {
                onConflict: 'proposal_id'
            });

        if (upsertError) {
            console.error('Error upserting proposals in Supabase:', upsertError);
            throw upsertError;
        }
        console.log(`Successfully processed ${enrichedProposals.length} governance proposals (inserted new ones, updated existing ones)`);
    } catch (error) {
        console.error('Error updating governance proposals:', error);
        process.exit(1);
    }
}

updateGovernanceProposals(); 