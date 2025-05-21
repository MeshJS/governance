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

async function fetchSPOData(): Promise<SPOData[]> {
    const url = 'https://api.koios.rest/api/v1/pool_list';
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${koiosApiKey}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Koios API error: Status ${response.status}`, errorText);
        throw new Error(`Failed to fetch SPO data: ${response.status} ${errorText}`);
    }

    const data = await response.json() as SPOData[];
    return data;
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

        // Add updated_at timestamp to each record
        const enrichedData = spoData.map(record => ({
            ...record,
            updated_at: new Date().toISOString()
        }));

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

        console.log(`Successfully updated ${enrichedData.length} SPO records`);
    } catch (error) {
        console.error('Error in updateSPOData:', error);
        process.exit(1);
    }
}

updateSPOData(); 