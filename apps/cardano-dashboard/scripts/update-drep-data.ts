import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds before retry
const DELEGATOR_UPDATE_THRESHOLD_DAYS = 5;

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

interface DRepCurrentData {
    drep_id: string;
    updated_at: string;
    delegators: DRepDelegator[];
    total_delegators: number;
    total_delegated_amount: string;
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

function isDelegatorUpdateNeeded(lastUpdateDate: string | null): boolean {
    if (!lastUpdateDate) return true;

    const lastUpdate = new Date(lastUpdateDate);
    const today = new Date();

    // Reset time part to compare only dates
    lastUpdate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastUpdate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= DELEGATOR_UPDATE_THRESHOLD_DAYS;
}

async function fetchCurrentDRepData(drepIds: string[]): Promise<Map<string, DRepCurrentData>> {
    const batchSize = 100; // Smaller batch size for URI limits
    const result = new Map<string, DRepCurrentData>();

    for (let i = 0; i < drepIds.length; i += batchSize) {
        const batch = drepIds.slice(i, i + batchSize);

        const { data: currentData, error: fetchError } = await supabase
            .from('drep_data')
            .select('drep_id, updated_at, delegators, total_delegators, total_delegated_amount')
            .in('drep_id', batch);

        if (fetchError) {
            console.error(`Error fetching current DRep data for batch ${i / batchSize + 1}:`, fetchError);
            throw fetchError;
        }

        (currentData as DRepCurrentData[] | null)?.forEach(record => {
            result.set(record.drep_id, record);
        });

        // Add a small delay between batches
        await sleep(1000);
    }

    return result;
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

        // Filter for active DReps
        const activeDReps = allDetailedData.filter(drep => drep.active);
        console.log(`Found ${activeDReps.length} active DReps out of ${allDetailedData.length} total DReps`);

        // Fetch current data from Supabase in batches
        console.log('Fetching current DRep data from Supabase...');
        const currentDataMap = await fetchCurrentDRepData(allDetailedData.map(drep => drep.drep_id));

        // Fetch delegators for each active DRep with rate limiting
        console.log('Fetching delegators for active DReps...');
        const enrichedData = [];

        for (const record of allDetailedData) {
            const currentRecord = currentDataMap.get(record.drep_id);
            const needsUpdate = isDelegatorUpdateNeeded(currentRecord?.updated_at || null);

            // Only fetch delegators for active DReps that need updating
            if (record.active && needsUpdate) {
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

                console.log(`Processed delegators for active DRep ${record.drep_id} (needed update)`);
            } else if (record.active) {
                // For active DReps that don't need updating, keep existing delegator data
                enrichedData.push({
                    ...record,
                    delegators: currentRecord?.delegators || [],
                    total_delegators: currentRecord?.total_delegators || 0,
                    total_delegated_amount: currentRecord?.total_delegated_amount || '0',
                    updated_at: new Date().toISOString()
                });
                console.log(`Skipped delegator fetch for active DRep ${record.drep_id} (recently updated)`);
            } else {
                // For inactive DReps, just update the record without delegator data
                enrichedData.push({
                    ...record,
                    delegators: [],
                    total_delegators: 0,
                    total_delegated_amount: '0',
                    updated_at: new Date().toISOString()
                });
                console.log(`Skipped delegator fetch for inactive DRep ${record.drep_id}`);
            }
        }

        // Update Supabase in batches
        console.log('Updating Supabase with new data...');
        const updateBatchSize = 100;
        for (let i = 0; i < enrichedData.length; i += updateBatchSize) {
            const batch = enrichedData.slice(i, i + updateBatchSize);
            const { error } = await supabase
                .from('drep_data')
                .upsert(batch, {
                    onConflict: 'drep_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`Error updating DRep data batch ${i / updateBatchSize + 1}:`, error);
                throw error;
            }

            console.log(`Updated batch ${i / updateBatchSize + 1} of ${Math.ceil(enrichedData.length / updateBatchSize)}`);
            await sleep(1000); // Add delay between batch updates
        }

        console.log(`Successfully updated ${enrichedData.length} DRep records with delegator information`);
    } catch (error) {
        console.error('Error in updateDRepData:', error);
        process.exit(1);
    }
}

updateDRepData(); 