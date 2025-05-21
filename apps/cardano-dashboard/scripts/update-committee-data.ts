import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CommitteeMember {
    status: string;
    cc_hot_id: string;
    cc_cold_id: string;
    cc_hot_hex: string;
    cc_cold_hex: string;
    expiration_epoch: number;
    cc_hot_has_script: boolean;
    cc_cold_has_script: boolean;
}

interface CommitteeInfo {
    proposal_id: string | null;
    proposal_tx_hash: string | null;
    proposal_index: number | null;
    quorum_numerator: number;
    quorum_denominator: number;
    members: CommitteeMember[];
}

interface CommitteeVote {
    proposal_id: string;
    proposal_tx_hash: string;
    proposal_index: number;
    vote_tx_hash: string;
    block_time: number;
    vote: 'Yes' | 'No' | 'Abstain';
    meta_url: string | null;
    meta_hash: string | null;
}

async function fetchCommitteeInfo(): Promise<CommitteeInfo[]> {
    const url = 'https://api.koios.rest/api/v1/committee_info';

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${koiosApiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Koios API error: Status ${response.status}`, errorText);
            throw new Error(`Failed to fetch committee info: ${response.status} ${errorText}`);
        }

        return await response.json() as CommitteeInfo[];
    } catch (error) {
        console.error('Error fetching committee info:', error);
        throw error;
    }
}

async function fetchCommitteeVotes(ccHotId: string): Promise<CommitteeVote[]> {
    const url = `https://api.koios.rest/api/v1/committee_votes?_cc_hot_id=${ccHotId}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${koiosApiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Koios API error: Status ${response.status}`, errorText);
            throw new Error(`Failed to fetch committee votes: ${response.status} ${errorText}`);
        }

        return await response.json() as CommitteeVote[];
    } catch (error) {
        console.error(`Error fetching votes for committee member ${ccHotId}:`, error);
        throw error;
    }
}

async function updateCommitteeData() {
    try {
        console.log('Fetching committee information from Koios...');
        const committeeInfo = await fetchCommitteeInfo();

        if (!committeeInfo || committeeInfo.length === 0) {
            console.log('No committee data received from Koios');
            return;
        }

        const committeeData = committeeInfo[0]; // We expect only one committee info object
        console.log(`Processing ${committeeData.members.length} committee members`);

        // Process each committee member and their votes
        const enrichedData = await Promise.all(
            committeeData.members.map(async (member) => {
                console.log(`Fetching votes for committee member ${member.cc_hot_id}`);
                const votes = await fetchCommitteeVotes(member.cc_hot_id);

                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

                return {
                    ...member,
                    // Include all committee governance fields
                    proposal_id: committeeData.proposal_id,
                    proposal_tx_hash: committeeData.proposal_tx_hash,
                    proposal_index: committeeData.proposal_index,
                    quorum_numerator: committeeData.quorum_numerator,
                    quorum_denominator: committeeData.quorum_denominator,
                    votes: votes,
                    updated_at: new Date().toISOString()
                };
            })
        );

        // Update Supabase
        const { error } = await supabase
            .from('committee_data')
            .upsert(enrichedData, {
                onConflict: 'cc_hot_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error updating committee data:', error);
            throw error;
        }

        console.log(`Successfully updated ${enrichedData.length} committee member records`);
    } catch (error) {
        console.error('Error in updateCommitteeData:', error);
        process.exit(1);
    }
}

updateCommitteeData(); 