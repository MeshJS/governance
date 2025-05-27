import { createClient } from '@supabase/supabase-js';
import { SPORelay } from '../types/spo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LocationResponse {
    lat: number;
    lon: number;
}

// Rate limiting helper
const rateLimiter = {
    queue: [] as (() => Promise<void>)[],
    processing: false,
    lastRequestTime: 0,
    minDelay: 1000, // Minimum delay between requests in ms

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            this.processQueue();
        });
    },

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minDelay) {
            await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
        }

        const nextRequest = this.queue.shift();
        if (nextRequest) {
            this.lastRequestTime = Date.now();
            await nextRequest();
        }

        this.processing = false;
        this.processQueue();
    }
};

async function fetchLocation(ip: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const response = await rateLimiter.add(() =>
            fetch(`http://ip-api.com/json/${ip}?fields=lat,lon`)
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as LocationResponse;
        if (data.lat && data.lon) {
            return { lat: data.lat, lng: data.lon };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching location for IP ${ip}:`, error);
        return null;
    }
}

async function updateSPOLocations() {
    try {
        console.log('Fetching SPO data from Supabase...');
        const { data: spoData, error: fetchError } = await supabase
            .from('spo_data')
            .select('pool_id_bech32, relays, location')
            .is('location', null);

        if (fetchError) {
            throw fetchError;
        }

        if (!spoData || spoData.length === 0) {
            console.log('No SPO data found');
            return;
        }

        console.log(`Processing ${spoData.length} SPO records`);

        for (const pool of spoData) {
            // Skip if location already exists
            if (pool.location) {
                continue;
            }

            let location = null;
            if (pool.relays && pool.relays.length > 0) {
                // Try to get location from the first relay with an IPv4 address
                const relayWithIpv4 = pool.relays.find((relay: SPORelay) => relay.ipv4);
                if (relayWithIpv4?.ipv4) {
                    location = await fetchLocation(relayWithIpv4.ipv4);
                }
            }

            if (location) {
                console.log(`Updating location for pool ${pool.pool_id_bech32}`);
                const { error: updateError } = await supabase
                    .from('spo_data')
                    .update({ location })
                    .eq('pool_id_bech32', pool.pool_id_bech32);

                if (updateError) {
                    console.error(`Error updating location for pool ${pool.pool_id_bech32}:`, updateError);
                }
            }
        }

        console.log('Finished updating SPO locations');
    } catch (error) {
        console.error('Error in updateSPOLocations:', error);
        process.exit(1);
    }
}

updateSPOLocations(); 