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

function calculateDelegatorCountsByEpoch(delegators, currentEpoch) {
    // Group delegators by the epoch they joined
    const delegatorsByJoinEpoch = {};

    for (const delegator of delegators) {
        const joinEpoch = delegator.epoch_no;
        if (!delegatorsByJoinEpoch[joinEpoch]) {
            delegatorsByJoinEpoch[joinEpoch] = [];
        }
        delegatorsByJoinEpoch[joinEpoch].push(delegator);
    }

    // Calculate cumulative delegator counts for each epoch
    const delegatorCountsByEpoch = {};
    let cumulativeCount = 0;

    // Get all epochs from the voting power history to ensure we cover all relevant epochs
    const allEpochs = Object.keys(delegatorsByJoinEpoch).map(Number).sort((a, b) => a - b);

    // Start from the earliest epoch and build up the cumulative count
    for (let epoch = Math.min(...allEpochs); epoch <= currentEpoch; epoch++) {
        // Add new delegators who joined in this epoch
        if (delegatorsByJoinEpoch[epoch]) {
            cumulativeCount += delegatorsByJoinEpoch[epoch].length;
        }

        // Store the cumulative count for this epoch
        delegatorCountsByEpoch[epoch] = cumulativeCount;
    }

    console.log(`Calculated delegator counts for ${Object.keys(delegatorCountsByEpoch).length} epochs`);
    console.log(`Total unique delegators: ${cumulativeCount}`);

    return delegatorCountsByEpoch;
}

async function upsertDRepDelegationInfo(drepId, votingPowerHistory, currentDelegators, currentEpoch) {
    try {
        // Fetch existing epochs for this drep_id first
        const { data: existing, error: fetchError } = await supabase
            .from('drep_delegation_info')
            .select('epochs')
            .eq('drep_id', drepId)
            .single();
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            throw fetchError;
        }

        // Check if we need to calculate delegator counts (only if existing epochs have zero delegator counts)
        let shouldCalculateDelegatorCounts = true;
        let delegatorCountsByEpoch = {};

        if (existing && existing.epochs) {
            // Check if more than one existing epoch has non-zero delegator counts
            const epochsWithDelegators = Object.values(existing.epochs).filter(epoch =>
                epoch.total_delegators && epoch.total_delegators > 0
            );
            const hasExistingDelegatorCounts = epochsWithDelegators.length > 1;

            if (hasExistingDelegatorCounts) {
                shouldCalculateDelegatorCounts = false;
                console.log(`Existing delegator counts found in ${epochsWithDelegators.length} epochs, preserving historical data`);
            } else {
                console.log('Insufficient existing delegator counts found, calculating from join dates');
                delegatorCountsByEpoch = calculateDelegatorCountsByEpoch(currentDelegators, currentEpoch);
            }
        } else {
            // No existing data, calculate delegator counts
            console.log('No existing data found, calculating delegator counts from join dates');
            delegatorCountsByEpoch = calculateDelegatorCountsByEpoch(currentDelegators, currentEpoch);
        }

        // Build epochs object with voting power for all epochs
        const newEpochs = {};
        for (const epochData of votingPowerHistory) {
            const epochNo = epochData.epoch_no;
            newEpochs[epochNo] = {
                voting_power_lovelace: epochData.amount,
                total_delegators: shouldCalculateDelegatorCounts ? (delegatorCountsByEpoch[epochNo] || 0) : 0
            };
        }

        // Merge with existing data
        let mergedEpochs = { ...newEpochs };
        if (existing && existing.epochs) {
            mergedEpochs = { ...existing.epochs };
            for (const [epochNo, epochData] of Object.entries(newEpochs)) {
                if (epochNo === currentEpoch.toString()) {
                    // For current epoch, update both voting power and delegator count
                    mergedEpochs[epochNo] = {
                        voting_power_lovelace: epochData.voting_power_lovelace,
                        total_delegators: currentDelegators.length // Always use current delegator count for current epoch
                    };
                } else {
                    // For other epochs, only update voting power, preserve existing delegator count
                    const existingEpoch = existing.epochs[epochNo];
                    mergedEpochs[epochNo] = {
                        voting_power_lovelace: epochData.voting_power_lovelace,
                        total_delegators: existingEpoch?.total_delegators || (shouldCalculateDelegatorCounts ? delegatorCountsByEpoch[epochNo] || 0 : 0)
                    };
                }
            }
        }

        const totalAmountAda = Number(votingPowerHistory[0]?.amount || 0) / 1_000_000;

        const { data, error } = await supabase
            .from('drep_delegation_info')
            .upsert({
                drep_id: drepId,
                epochs: mergedEpochs,
                current_epoch: currentEpoch,
                total_delegators: currentDelegators.length,
                total_amount_ada: totalAmountAda
            }, {
                onConflict: 'drep_id'
            });

        if (error) throw error;

        const updateType = shouldCalculateDelegatorCounts ? 'calculated delegator counts for all epochs' : 'preserved existing delegator counts, updated current epoch only';
        console.log(`DRep delegation info updated in Supabase - voting power for all epochs, ${updateType}`);
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
        console.log(`- Total Current Delegators: ${currentDelegators.length}`);
        console.log(`- Current Voting Power: ${votingPowerHistory[0]?.amount || 0} lovelace`);
        console.log(`- Epochs with Voting Power Data: ${votingPowerHistory.length}`);
        console.log(`- Delegator Counts: ${shouldCalculateDelegatorCounts ? 'Calculated from join dates for all epochs' : 'Preserved existing data, updated current epoch only'}`);
        console.log(`- DRep ID: ${drepId}`);
        console.log('\nData successfully saved to Supabase!');

    } catch (error) {
        console.error('Error saving data to Supabase:', error);
        process.exit(1);
    }
}

main(); 