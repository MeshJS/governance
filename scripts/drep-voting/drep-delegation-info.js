import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const drepId = config.drepId;

if (!drepId) {
    console.error('DRep ID not found in config.json');
    process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getDRepVotingPowerHistory(drepId) {
    try {
        const apiKey = process.env.KOIOS_API_KEY;
        if (!apiKey) {
            throw new Error('KOIOS_API_KEY environment variable is not set');
        }

        const response = await axios.get(`https://api.koios.rest/api/v1/drep_voting_power_history?_drep_id=${drepId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        });

        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response format: expected an array');
        }

        console.log(`Found voting power history for ${response.data.length} epochs`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DRep voting power history:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return [];
    }
}

async function getDRepDelegators(drepId) {
    try {
        const apiKey = process.env.KOIOS_API_KEY;
        if (!apiKey) {
            throw new Error('KOIOS_API_KEY environment variable is not set');
        }

        const response = await axios.get(`https://api.koios.rest/api/v1/drep_delegators?_drep_id=${drepId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        });

        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response format: expected an array');
        }

        console.log(`Found ${response.data.length} current delegators for DRep ${drepId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DRep delegators:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return [];
    }
}

async function getCurrentEpoch() {
    try {
        const apiKey = process.env.KOIOS_API_KEY;
        if (!apiKey) {
            throw new Error('KOIOS_API_KEY environment variable is not set');
        }

        const response = await axios.get('https://api.koios.rest/api/v1/tip', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        });

        if (!Array.isArray(response.data) || response.data.length === 0) {
            throw new Error('Invalid response format from tip endpoint');
        }

        return response.data[0].epoch_no;
    } catch (error) {
        console.error('Error fetching current epoch:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return 0;
    }
}

async function upsertDRepDelegationInfo(drepId, votingPowerHistory, currentDelegators, currentEpoch) {
    try {
        // Build the epochs object
        const epochs = {};
        for (const epochData of votingPowerHistory) {
            epochs[epochData.epoch_no] = {
                voting_power_lovelace: epochData.amount,
                total_delegators: epochData.epoch_no === currentEpoch ? currentDelegators.length : 0
            };
        }

        const totalAmountAda = Number(votingPowerHistory[0]?.amount || 0) / 1_000_000;

        const { data, error } = await supabase
            .from('drep_delegation_info')
            .upsert({
                drep_id: drepId,
                epochs,
                current_epoch: currentEpoch,
                total_delegators: currentDelegators.length,
                total_amount_ada: totalAmountAda
            }, {
                onConflict: 'drep_id'
            });

        if (error) throw error;

        console.log('DRep delegation info updated in Supabase');
        return data;
    } catch (error) {
        console.error('Error upserting DRep delegation info:', error);
        throw error;
    }
}

async function main() {
    const votingPowerHistory = await getDRepVotingPowerHistory(drepId);
    const currentDelegators = await getDRepDelegators(drepId);
    const currentEpoch = await getCurrentEpoch();

    if (votingPowerHistory.length === 0) {
        console.error('Failed to fetch voting power history, aborting...');
        process.exit(1);
    }

    try {
        // Upsert all data into the new table
        await upsertDRepDelegationInfo(drepId, votingPowerHistory, currentDelegators, currentEpoch);

        // Log summary
        console.log('\nDelegation Summary:');
        console.log(`- Current Epoch: ${currentEpoch}`);
        console.log(`- Total Delegators: ${currentDelegators.length}`);
        console.log(`- Current Voting Power: ${votingPowerHistory[0]?.amount || 0} lovelace`);
        console.log(`- Historical Epochs Tracked: ${votingPowerHistory.length}`);
        console.log(`- DRep ID: ${drepId}`);
        console.log('\nData successfully saved to Supabase!');

    } catch (error) {
        console.error('Error saving data to Supabase:', error);
        process.exit(1);
    }
}

main(); 