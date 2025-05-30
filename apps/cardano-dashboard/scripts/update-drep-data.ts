import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds before retry

interface DRepBasicData {
    drep_id: string;
    hex: string;
    has_script: boolean;
    registered: boolean;
}

interface DRepDetailedData extends DRepBasicData {
    deposit: string;
    active: boolean;
    expires_epoch_no: number;
    amount: string;
    meta_url: string;
    meta_hash: string;
}

interface DRepDelegator {
    stake_address: string;
    stake_address_hex: string;
    script_hash: string | null;
    epoch_no: number;
    amount: string;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
    try {
        const response = await fetch(url, options);

        if (response.status === 429) {
            if (retries > 0) {
                console.log(`Rate limited, retrying in ${RETRY_DELAY / 1000} seconds... (${retries} retries left)`);
                await sleep(RETRY_DELAY);
                return fetchWithRetry(url, options, retries - 1);
            }
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Request failed, retrying in ${RETRY_DELAY / 1000} seconds... (${retries} retries left)`);
            await sleep(RETRY_DELAY);
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

async function fetchDRepList(): Promise<DRepBasicData[]> {
    const url = 'https://api.koios.rest/api/v1/drep_list';
    let allData: DRepBasicData[] = [];
    let offset = 0;
    const limit = 500;
    let hasMoreData = true;

    while (hasMoreData) {
        try {
            const paginatedUrl = `${url}?offset=${offset}&limit=${limit}`;
            const response = await fetchWithRetry(paginatedUrl, {
                headers: {
                    'Authorization': `Bearer ${koiosApiKey}`,
                    'Accept': 'application/json',
                    'Prefer': 'count=estimated'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Koios API error: Status ${response.status}`, errorText);
                throw new Error(`Failed to fetch DRep list: ${response.status} ${errorText}`);
            }

            const data = await response.json() as DRepBasicData[];

            if (!data || data.length === 0) {
                hasMoreData = false;
                break;
            }

            allData = [...allData, ...data];
            console.log(`Fetched ${data.length} DRep records, total: ${allData.length}`);

            if (data.length < limit) {
                hasMoreData = false;
            } else {
                offset += limit;
            }

            await sleep(RATE_LIMIT_DELAY);
        } catch (error) {
            console.error(`Error fetching DRep list at offset ${offset}:`, error);
            hasMoreData = false;
            throw error;
        }
    }

    return allData;
}

async function fetchDRepDetails(drepIds: string[]): Promise<DRepDetailedData[]> {
    const url = 'https://api.koios.rest/api/v1/drep_info';

    try {
        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${koiosApiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                _drep_ids: drepIds
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Koios API error: Status ${response.status}`, errorText);
            throw new Error(`Failed to fetch DRep details: ${response.status} ${errorText}`);
        }

        return await response.json() as DRepDetailedData[];
    } catch (error) {
        console.error('Error fetching DRep details:', error);
        throw error;
    }
}

async function fetchDRepDelegators(drepId: string): Promise<DRepDelegator[]> {
    const url = `https://api.koios.rest/api/v1/drep_delegators?_drep_id=${drepId}`;

    try {
        const response = await fetchWithRetry(url, {
            headers: {
                'Authorization': `Bearer ${koiosApiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Koios API error: Status ${response.status}`, errorText);
            throw new Error(`Failed to fetch DRep delegators: ${response.status} ${errorText}`);
        }

        return await response.json() as DRepDelegator[];
    } catch (error) {
        console.error(`Error fetching delegators for DRep ${drepId}:`, error);
        return [];
    }
}

async function updateDRepData() {
    try {
        console.log('Fetching DRep list from Koios...');
        const drepList = await fetchDRepList();

        if (!drepList || drepList.length === 0) {
            console.log('No DRep data received from Koios');
            return;
        }

        console.log(`Received ${drepList.length} DRep records`);

        // Process DReps in smaller batches to avoid rate limits
        const batchSize = 25; // Reduced batch size
        const allDetailedData: DRepDetailedData[] = [];

        for (let i = 0; i < drepList.length; i += batchSize) {
            const batch = drepList.slice(i, i + batchSize);
            const batchIds = batch.map(drep => drep.drep_id);

            console.log(`Fetching details for batch ${i / batchSize + 1} of ${Math.ceil(drepList.length / batchSize)}`);
            const detailedData = await fetchDRepDetails(batchIds);
            allDetailedData.push(...detailedData);

            await sleep(RATE_LIMIT_DELAY);
        }

        // Fetch delegators for each DRep with rate limiting
        console.log('Fetching delegators for each DRep...');
        const enrichedData = [];

        for (const record of allDetailedData) {
            await sleep(RATE_LIMIT_DELAY);

            const delegators = await fetchDRepDelegators(record.drep_id);
            const totalDelegatedAmount = delegators.reduce((sum, delegator) =>
                sum + BigInt(delegator.amount), BigInt(0)).toString();

            enrichedData.push({
                ...record,
                delegators,
                total_delegators: delegators.length,
                total_delegated_amount: totalDelegatedAmount,
                updated_at: new Date().toISOString()
            });

            console.log(`Processed delegators for DRep ${record.drep_id}`);
        }

        // Update Supabase
        const { error } = await supabase
            .from('drep_data')
            .upsert(enrichedData, {
                onConflict: 'drep_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error updating DRep data:', error);
            throw error;
        }

        console.log(`Successfully updated ${enrichedData.length} DRep records with delegator information`);
    } catch (error) {
        console.error('Error in updateDRepData:', error);
        process.exit(1);
    }
}

updateDRepData(); 