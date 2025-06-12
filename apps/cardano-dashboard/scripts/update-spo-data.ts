import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SPORelay {
    dns?: string;
    srv?: string;
    ipv4?: string;
    ipv6?: string;
    port?: number;
}

interface SPOData {
    pool_id_bech32: string;
    pool_id_hex: string;
    active_epoch_no: number;
    margin: number;
    fixed_cost: string;
    pledge: string;
    deposit: string;
    reward_addr: string;
    owners: string[];
    relays: SPORelay[];
    ticker: string;
    pool_group: string;
    meta_url: string;
    meta_hash: string;
    pool_status: string;
    active_stake: string;
    retiring_epoch: number;
}

interface TipData {
    hash: string;
    epoch_no: number;
    abs_slot: number;
    epoch_slot: number;
    block_height: number;
    block_time: number;
}

interface DetailedPoolInfo {
    pool_id_bech32: string;
    vrf_key_hash: string;
    reward_addr_delegated_drep: string | null;
    meta_json: any;
    op_cert: string;
    op_cert_counter: number;
    sigma: number;
    block_count: number;
    live_pledge: string;
    live_stake: string;
    live_delegators: number;
    live_saturation: number;
    voting_power: string;
}

async function fetchSPOData(): Promise<SPOData[]> {
    // First get current epoch to calculate the range
    const tipResponse = await fetch('https://api.koios.rest/api/v1/tip', {
        headers: {
            'Authorization': `Bearer ${koiosApiKey}`,
            'Accept': 'application/json'
        }
    });

    if (!tipResponse.ok) {
        throw new Error('Failed to fetch current epoch');
    }

    const tipData = await tipResponse.json() as TipData[];
    const currentEpoch = tipData[0].epoch_no;
    const minRetiringEpoch = currentEpoch - 5;

    const url = 'https://api.koios.rest/api/v1/pool_list';
    let allData: SPOData[] = [];
    let offset = 0;
    const limit = 500; // Reduced from 1000 to 500 for safer pagination
    let hasMoreData = true;

    while (hasMoreData) {
        try {
            // Add filters for pool status and retiring epoch
            const paginatedUrl = `${url}?offset=${offset}&limit=${limit}&or=(pool_status.eq.registered,and(pool_status.eq.retired,retiring_epoch.gte.${minRetiringEpoch}),pool_status.eq.retiring)`;
            const response = await fetch(paginatedUrl, {
                headers: {
                    'Authorization': `Bearer ${koiosApiKey}`,
                    'Accept': 'application/json',
                    'Prefer': 'count=estimated' // Request estimated count
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Koios API error: Status ${response.status}`, errorText);
                throw new Error(`Failed to fetch SPO data: ${response.status} ${errorText}`);
            }

            // Get the Content-Range header to understand pagination
            const contentRange = response.headers.get('content-range');
            if (!contentRange) {
                console.warn('No Content-Range header received from API');
            } else {
                console.log(`Content-Range: ${contentRange}`);
            }

            const data = await response.json() as SPOData[];

            if (!data || data.length === 0) {
                hasMoreData = false;
                break;
            }

            allData = [...allData, ...data];
            console.log(`Fetched ${data.length} records, total: ${allData.length}`);

            // Check if we've received fewer records than the limit
            if (data.length < limit) {
                hasMoreData = false;
            } else {
                offset += limit;
            }

            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error fetching data at offset ${offset}:`, error);
            // If we encounter an error, we'll stop pagination
            hasMoreData = false;
            throw error;
        }
    }

    return allData;
}

async function fetchDetailedPoolInfo(poolIds: string[]): Promise<DetailedPoolInfo[]> {
    const batchSize = 50; // Process 50 pools at a time
    const batches = [];

    // Split pool IDs into batches
    for (let i = 0; i < poolIds.length; i += batchSize) {
        batches.push(poolIds.slice(i, i + batchSize));
    }

    console.log(`Starting to fetch detailed info for ${poolIds.length} pools in ${batches.length} batches`);
    let allDetailedInfo: DetailedPoolInfo[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} pools)`);

        try {
            console.log(`Making API request for batch ${batchIndex + 1}...`);
            const response = await fetch('https://api.koios.rest/api/v1/pool_info', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${koiosApiKey}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    _pool_bech32_ids: batch
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Koios API error for batch ${batchIndex + 1}: Status ${response.status}`, errorText);
                throw new Error(`Failed to fetch detailed pool info: ${response.status} ${errorText}`);
            }

            const data = await response.json() as DetailedPoolInfo[];
            console.log(`Successfully received data for ${data.length} pools in batch ${batchIndex + 1}`);

            // Log some sample data for verification
            if (data.length > 0) {
                console.log(`Sample pool data from batch ${batchIndex + 1}:`);
            }

            allDetailedInfo = [...allDetailedInfo, ...data];
            console.log(`Progress: ${allDetailedInfo.length}/${poolIds.length} pools processed`);

            // Add a small delay between batches to respect rate limits
            console.log(`Waiting 1 second before next batch...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error fetching detailed info for batch ${batchIndex + 1}:`, error);
            throw error;
        }
    }

    console.log(`Completed fetching detailed info for all ${allDetailedInfo.length} pools`);
    return allDetailedInfo;
}

async function updateSPOData() {
    try {
        console.log('Fetching SPO data from Koios...');
        const spoData = await fetchSPOData();

        if (!spoData || spoData.length === 0) {
            console.log('No SPO data received from Koios');
            return;
        }

        console.log(`Received ${spoData.length} SPO records`);

        // Fetch detailed pool information
        console.log('Fetching detailed pool information...');
        const poolIds = spoData.map(pool => pool.pool_id_bech32);
        const detailedInfo = await fetchDetailedPoolInfo(poolIds);
        console.log(`Received detailed info for ${detailedInfo.length} pools`);

        // Merge the data
        const enrichedData = spoData.map(record => {
            const detailed = detailedInfo.find(d => d.pool_id_bech32 === record.pool_id_bech32);
            return {
                ...record,
                ...detailed,
                updated_at: new Date().toISOString()
            };
        });

        // Update Supabase
        const { error } = await supabase
            .from('spo_data')
            .upsert(enrichedData, {
                onConflict: 'pool_id_bech32',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error updating SPO data:', error);
            throw error;
        }

        console.log(`Successfully updated ${enrichedData.length} SPO records with detailed information`);
    } catch (error) {
        console.error('Error in updateSPOData:', error);
        process.exit(1);
    }
}

updateSPOData(); 