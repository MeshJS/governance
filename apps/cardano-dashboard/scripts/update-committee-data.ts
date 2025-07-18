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
    name?: string;
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
    meta_json?: any;
    committee_name?: string;
}

interface ChainTip {
    hash: string;
    epoch_no: number;
    abs_slot: number;
    epoch_slot: number;
    block_time: number;
}

// Add IPFS gateways
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return response;
            }
            // If we get a 504, try the next gateway or retry
            if (response.status === 504 && url.includes('ipfs.io')) {
                const ipfsHash = url.split('/ipfs/')[1];
                // Try next gateway
                const nextGatewayIndex = (IPFS_GATEWAYS.indexOf(url.split('/ipfs/')[0] + '/ipfs/') + 1) % IPFS_GATEWAYS.length;
                const nextGateway = IPFS_GATEWAYS[nextGatewayIndex];
                url = `${nextGateway}${ipfsHash}`;
                continue;
            }
            // For other errors, wait and retry
            await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error(`Failed to fetch after ${retries} retries`);
}

async function fetchCurrentEpoch(): Promise<number> {
    const url = 'https://api.koios.rest/api/v1/tip';

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
            throw new Error(`Failed to fetch chain tip: ${response.status} ${errorText}`);
        }

        const tip = await response.json() as ChainTip[];
        return tip[0].epoch_no;
    } catch (error) {
        console.error('Error fetching current epoch:', error);
        throw error;
    }
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

async function fetchMetaJson(url: string): Promise<any> {
    try {
        // Clean up the URL
        let cleanUrl = url.trim();
        // Remove trailing colons
        cleanUrl = cleanUrl.replace(/:$/, '');
        // Remove any trailing slashes
        cleanUrl = cleanUrl.replace(/\/$/, '');

        // Handle IPFS URLs
        let fetchUrl = cleanUrl;
        if (cleanUrl.startsWith('ipfs://')) {
            const ipfsHash = cleanUrl.replace('ipfs://', '');
            // Start with the first gateway
            fetchUrl = `${IPFS_GATEWAYS[0]}${ipfsHash}`;
        }

        console.log(`Fetching meta JSON from cleaned URL: ${fetchUrl}`);
        const response = await fetchWithRetry(fetchUrl);

        // Try to parse the response as JSON
        try {
            const text = await response.text();
            // Try to clean the text if it's not valid JSON
            const cleanedText = text
                .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
                .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                .replace(/\n/g, ' ')     // Remove newlines
                .replace(/\r/g, '')      // Remove carriage returns
                .replace(/\t/g, ' ');    // Replace tabs with spaces

            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error(`Failed to parse JSON from ${cleanUrl}:`, parseError);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching meta JSON from ${url}:`, error);
        return null;
    }
}

async function updateCommitteeData() {
    try {
        console.log('Fetching current epoch...');
        const currentEpoch = await fetchCurrentEpoch();
        console.log(`Current epoch: ${currentEpoch}`);

        console.log('Fetching committee information from Koios...');
        const committeeInfo = await fetchCommitteeInfo();

        if (!committeeInfo || committeeInfo.length === 0) {
            console.log('No committee data received from Koios');
            return;
        }

        console.log(`Processing ${committeeInfo.length} committee objects`);

        // Process all committee objects
        const allEnrichedData = await Promise.all(
            committeeInfo.map(async (committeeData) => {
                console.log(`Processing committee with proposal ID: ${committeeData.proposal_id}`);

                // Filter members to include those that expired within the last 2 epochs
                const activeMembers = committeeData.members.filter(member =>
                    member.expiration_epoch > currentEpoch - 2
                );
                console.log(`Processing ${activeMembers.length} active/recently expired committee members (${committeeData.members.length - activeMembers.length} fully expired)`);

                // Process each active committee member and their votes
                const enrichedData = await Promise.all(
                    activeMembers.map(async (member) => {
                        const memberStatus = member.expiration_epoch > currentEpoch ? 'active' : 'recently expired';
                        console.log(`Fetching votes for ${memberStatus} committee member ${member.cc_hot_id}`);
                        const votes = await fetchCommitteeVotes(member.cc_hot_id);

                        // Process meta JSON for each vote
                        const processedVotes = await Promise.all(
                            votes.map(async (vote) => {
                                if (vote.meta_url) {
                                    const metaJson = await fetchMetaJson(vote.meta_url);
                                    if (metaJson && metaJson.authors && metaJson.authors.length > 0) {
                                        return {
                                            ...vote,
                                            meta_json: metaJson,
                                            committee_name: metaJson.authors[0].name
                                        };
                                    }
                                }
                                return vote;
                            })
                        );

                        // Add a small delay between requests to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Get the committee name from the first vote with meta JSON
                        const committeeName = processedVotes.find(v => v.committee_name)?.committee_name;

                        return {
                            ...member,
                            // Include all committee governance fields
                            proposal_id: committeeData.proposal_id,
                            proposal_tx_hash: committeeData.proposal_tx_hash,
                            proposal_index: committeeData.proposal_index,
                            quorum_numerator: committeeData.quorum_numerator,
                            quorum_denominator: committeeData.quorum_denominator,
                            votes: processedVotes,
                            name: committeeName, // Only use name from meta JSON
                            updated_at: new Date().toISOString()
                        };
                    })
                );

                return enrichedData;
            })
        );

        // Flatten the array of arrays into a single array
        const flattenedData = allEnrichedData.flat();

        // Update Supabase
        const { error } = await supabase
            .from('committee_data')
            .upsert(flattenedData, {
                onConflict: 'cc_hot_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error updating committee data:', error);
            throw error;
        }

        console.log(`Successfully updated ${flattenedData.length} committee member records`);
    } catch (error) {
        console.error('Error in updateCommitteeData:', error);
        process.exit(1);
    }
}

updateCommitteeData(); 