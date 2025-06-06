import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const koiosApiKey = process.env.KOIOS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds before retry
const METADATA_UPDATE_THRESHOLD_DAYS = 5;
const TEMPORARY_SKIP_DAYS_CHECK = false; // Temporary flag to bypass the 5-day check

interface DRepMetadata {
    drep_id: string;
    hex: string;
    has_script: boolean;
    meta_url: string | null;
    meta_hash: string | null;
    meta_json: any | null;
    bytes: string | null;
    warning: string | null;
    language: string | null;
    comment: string | null;
    is_valid: boolean | null;
}

interface DRepBasicInfo {
    drep_id: string;
    updated_at: string | null;
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

function isMetadataUpdateNeeded(lastUpdateDate: string | null): boolean {
    if (TEMPORARY_SKIP_DAYS_CHECK) return true;

    if (!lastUpdateDate) return true;

    const lastUpdate = new Date(lastUpdateDate);
    const today = new Date();

    // Reset time part to compare only dates
    lastUpdate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastUpdate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays >= METADATA_UPDATE_THRESHOLD_DAYS;
}

async function fetchActiveDReps(): Promise<DRepBasicInfo[]> {
    const { data, error } = await supabase
        .from('drep_data')
        .select('drep_id, updated_at')
        .eq('active', true);

    if (error) {
        console.error('Error fetching active DReps:', error);
        throw error;
    }

    return data;
}

async function fetchDRepMetadata(drepIds: string[]): Promise<DRepMetadata[]> {
    const url = 'https://api.koios.rest/api/v1/drep_metadata';

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
            throw new Error(`Failed to fetch DRep metadata: ${response.status} ${errorText}`);
        }

        return await response.json() as DRepMetadata[];
    } catch (error) {
        console.error('Error fetching DRep metadata:', error);
        throw error;
    }
}

async function fetchMetadataFromUrl(url: string): Promise<any> {
    try {
        // Handle IPFS URLs
        if (url.startsWith('ipfs://')) {
            const ipfsHash = url.replace('ipfs://', '');
            url = `https://ipfs.io/ipfs/${ipfsHash}`;
        }

        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch metadata from URL: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching metadata from URL ${url}:`, error);
        return null;
    }
}

async function updateDRepMetadata() {
    try {
        console.log('Fetching active DReps from Supabase...');
        const activeDReps = await fetchActiveDReps();
        console.log(`Found ${activeDReps.length} active DReps`);

        // Filter DReps that need metadata update
        const drepsNeedingUpdate = activeDReps.filter(drep => isMetadataUpdateNeeded(drep.updated_at));
        console.log(`${drepsNeedingUpdate.length} DReps need metadata update`);

        if (drepsNeedingUpdate.length === 0) {
            console.log('No DReps need metadata update at this time');
            return;
        }

        // Process DReps in smaller batches to avoid rate limits
        const batchSize = 25;
        const allMetadata: DRepMetadata[] = [];

        for (let i = 0; i < drepsNeedingUpdate.length; i += batchSize) {
            const batch = drepsNeedingUpdate.slice(i, i + batchSize).map(drep => drep.drep_id);

            console.log(`Fetching metadata for batch ${i / batchSize + 1} of ${Math.ceil(drepsNeedingUpdate.length / batchSize)}`);
            const metadata = await fetchDRepMetadata(batch);

            // Fetch metadata from URLs for entries where meta_json is null but meta_url exists
            for (const meta of metadata) {
                if (!meta.meta_json && meta.meta_url) {
                    console.log(`Fetching metadata from URL for DRep ${meta.drep_id}`);
                    meta.meta_json = await fetchMetadataFromUrl(meta.meta_url);
                    await sleep(RATE_LIMIT_DELAY); // Add delay between URL fetches
                }
            }

            allMetadata.push(...metadata);

            await sleep(RATE_LIMIT_DELAY);
        }

        // Update Supabase in batches
        console.log('Updating Supabase with new metadata...');
        const updateBatchSize = 100;
        for (let i = 0; i < allMetadata.length; i += updateBatchSize) {
            const batch = allMetadata.slice(i, i + updateBatchSize).map(metadata => ({
                drep_id: metadata.drep_id,
                meta_url: metadata.meta_url,
                meta_hash: metadata.meta_hash,
                meta_json: metadata.meta_json,
                meta_bytes: metadata.bytes,
                meta_warning: metadata.warning,
                meta_language: metadata.language,
                meta_comment: metadata.comment,
                meta_is_valid: metadata.is_valid,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('drep_data')
                .upsert(batch, {
                    onConflict: 'drep_id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`Error updating DRep metadata batch ${i / updateBatchSize + 1}:`, error);
                throw error;
            }

            console.log(`Updated batch ${i / updateBatchSize + 1} of ${Math.ceil(allMetadata.length / updateBatchSize)}`);
            await sleep(1000); // Add delay between batch updates
        }

        console.log(`Successfully updated metadata for ${allMetadata.length} DRep records`);
    } catch (error) {
        console.error('Error in updateDRepMetadata:', error);
        process.exit(1);
    }
}

updateDRepMetadata(); 