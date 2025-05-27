import { createClient } from '@supabase/supabase-js';
import { SPORelay } from '../types/spo';
import dns from 'dns';
import { promisify } from 'util';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configure DNS servers
dns.setServers([
    '8.8.8.8',    // Google DNS
    '1.1.1.1',    // Cloudflare DNS
    '9.9.9.9',    // Quad9 DNS
    '208.67.222.222' // OpenDNS
]);

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveSrv = promisify(dns.resolveSrv);
const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

interface LocationResponse {
    lat: number;
    lon: number;
}

// Rate limiting helper with exponential backoff
const rateLimiter = {
    queue: [] as (() => Promise<void>)[],
    processing: false,
    lastRequestTime: 0,
    minDelay: 2000, // Increased minimum delay between requests in ms
    backoffTime: 2000, // Initial backoff time in ms
    maxBackoffTime: 30000, // Maximum backoff time in ms

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    // Reset backoff on success
                    this.backoffTime = 2000;
                    resolve(result);
                } catch (error) {
                    if (error instanceof Error && error.message.includes('429')) {
                        // Increase backoff time on rate limit
                        this.backoffTime = Math.min(this.backoffTime * 2, this.maxBackoffTime);
                        console.log(`Rate limited, increasing backoff to ${this.backoffTime}ms`);
                    }
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
        const delay = Math.max(this.minDelay, this.backoffTime);

        if (timeSinceLastRequest < delay) {
            await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastRequest));
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

// DNS resolution helper with retries
const dnsResolver = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,

    async resolveWithRetry<T>(fn: () => Promise<T>, dnsName: string): Promise<T | null> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
                console.log(`DNS resolution attempt ${attempt} failed for ${dnsName}, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        console.log(`All DNS resolution attempts failed for ${dnsName}:`, lastError);
        return null;
    }
};

async function resolveDNS(dnsName: string): Promise<string | null> {
    try {
        // Skip DNS resolution for IP addresses
        if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(dnsName)) {
            return dnsName;
        }

        // Remove protocol prefix if present
        dnsName = dnsName.replace(/^(https?:\/\/)/, '');

        // Try IPv4 first
        const ipv4Addresses = await dnsResolver.resolveWithRetry(
            () => resolve4(dnsName),
            dnsName
        );
        if (ipv4Addresses && ipv4Addresses.length > 0) {
            console.log(`Successfully resolved IPv4 for ${dnsName}: ${ipv4Addresses[0]}`);
            return ipv4Addresses[0];
        }

        // Try IPv6
        const ipv6Addresses = await dnsResolver.resolveWithRetry(
            () => resolve6(dnsName),
            dnsName
        );
        if (ipv6Addresses && ipv6Addresses.length > 0) {
            console.log(`Successfully resolved IPv6 for ${dnsName}: ${ipv6Addresses[0]}`);
            return ipv6Addresses[0];
        }

        // Try CNAME
        const cnames = await dnsResolver.resolveWithRetry(
            () => resolveCname(dnsName),
            dnsName
        );
        if (cnames && cnames.length > 0) {
            console.log(`Found CNAME for ${dnsName}: ${cnames[0]}, trying to resolve...`);
            const resolvedIp = await resolveDNS(cnames[0]);
            if (resolvedIp) {
                return resolvedIp;
            }
        }

        // Try SRV records
        const srvRecords = await dnsResolver.resolveWithRetry(
            () => resolveSrv(dnsName),
            dnsName
        );
        if (srvRecords && srvRecords.length > 0) {
            console.log(`Found SRV record for ${dnsName}: ${srvRecords[0].name}, trying to resolve...`);
            const resolvedIp = await resolveDNS(srvRecords[0].name);
            if (resolvedIp) {
                return resolvedIp;
            }
        }

        // Try TXT records
        const txtRecords = await dnsResolver.resolveWithRetry(
            () => resolveTxt(dnsName),
            dnsName
        );
        if (txtRecords && txtRecords.length > 0) {
            for (const record of txtRecords) {
                // Look for both IPv4 and IPv6 addresses in TXT records
                const ipv4Match = record[0].match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
                if (ipv4Match) {
                    console.log(`Found IPv4 in TXT record for ${dnsName}: ${ipv4Match[0]}`);
                    return ipv4Match[0];
                }

                const ipv6Match = record[0].match(/\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/);
                if (ipv6Match) {
                    console.log(`Found IPv6 in TXT record for ${dnsName}: ${ipv6Match[0]}`);
                    return ipv6Match[0];
                }
            }
        }

        console.log(`Could not resolve any IP address for ${dnsName}`);
        return null;
    } catch (error) {
        console.log(`Error resolving DNS for ${dnsName}:`, error);
        return null;
    }
}

async function fetchLocation(ip: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const response = await rateLimiter.add(() =>
            fetch(`http://ip-api.com/json/${ip}?fields=lat,lon`)
        );

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('HTTP error! status: 429');
            }
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

async function updateRetiredPoolLocations() {
    try {
        console.log('Fetching retired SPO data from Supabase...');
        const { data: retiredPools, error: fetchError } = await supabase
            .from('spo_data')
            .select('pool_id_bech32')
            .eq('pool_status', 'retired')
            .not('location', 'is', null);

        if (fetchError) {
            throw fetchError;
        }

        if (!retiredPools || retiredPools.length === 0) {
            console.log('No retired pools found with locations');
            return;
        }

        console.log(`Processing ${retiredPools.length} retired pools`);

        for (const pool of retiredPools) {
            console.log(`Removing location for retired pool ${pool.pool_id_bech32}`);
            const { error: updateError } = await supabase
                .from('spo_data')
                .update({ location: null })
                .eq('pool_id_bech32', pool.pool_id_bech32);

            if (updateError) {
                console.error(`Error updating location for pool ${pool.pool_id_bech32}:`, updateError);
            }
        }

        console.log('Finished updating retired pool locations');
    } catch (error) {
        console.error('Error in updateRetiredPoolLocations:', error);
        process.exit(1);
    }
}

async function resolveRelay(relay: SPORelay): Promise<string | null> {
    // If we have a direct IPv4 address, use it
    if (relay.ipv4) {
        return relay.ipv4;
    }

    // If we have a direct IPv6 address, use it
    if (relay.ipv6) {
        return relay.ipv6;
    }

    // If we have a DNS name, try to resolve it
    if (relay.dns) {
        // First try to resolve the DNS name directly
        const resolvedIp = await resolveDNS(relay.dns);
        if (resolvedIp) {
            return resolvedIp;
        }

        // If direct resolution fails and we have an SRV record, try that
        if (relay.srv) {
            try {
                const srvRecords = await resolveSrv(relay.srv);
                if (srvRecords && srvRecords.length > 0) {
                    // Use the first SRV record's target
                    const target = srvRecords[0].name;
                    const resolvedIp = await resolveDNS(target);
                    if (resolvedIp) {
                        return resolvedIp;
                    }
                }
            } catch (error) {
                console.log(`SRV resolution failed for ${relay.srv}:`, error);
            }
        }
    }

    return null;
}

async function updateSPOLocations() {
    try {
        // First handle retired pools
        await updateRetiredPoolLocations();

        console.log('Fetching active SPO data from Supabase...');
        const { data: spoData, error: fetchError } = await supabase
            .from('spo_data')
            .select('pool_id_bech32, relays, location')
            .is('location', null)
            .in('pool_status', ['registered', 'retiring']);

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
                // Try each relay in sequence until we get a location
                for (const relay of pool.relays) {
                    const ip = await resolveRelay(relay);
                    if (ip) {
                        location = await fetchLocation(ip);
                        if (location) {
                            break; // Stop if we got a valid location
                        }
                    }
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
            } else {
                console.log(`Could not determine location for pool ${pool.pool_id_bech32} - no valid relay found or geolocation failed`);
            }
        }

        console.log('Finished updating SPO locations');
    } catch (error) {
        console.error('Error in updateSPOLocations:', error);
        process.exit(1);
    }
}

updateSPOLocations(); 