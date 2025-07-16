import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read config file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const drepId = config.drepId;
const organizationName = config.organizationName;

// Read missing rationales file
const missingRationalesPath = path.join(__dirname, '..', '..', 'voting-history', 'missing-voting-rationales', 'rationales.json');
let missingRationales = {};
try {
    missingRationales = JSON.parse(fs.readFileSync(missingRationalesPath, 'utf8'));
} catch (error) {
    console.warn('Could not read missing rationales file:', error.message);
}

if (!drepId) {
    console.error('DRep ID not found in config.json');
    process.exit(1);
}

if (!organizationName) {
    console.error('Organization name not found in config.json');
    process.exit(1);
}

async function fetchMetadata(metaUrl) {
    try {
        // Handle IPFS URLs
        if (metaUrl.startsWith('ipfs://')) {
            const ipfsHash = metaUrl.replace('ipfs://', '');
            const response = await axios.get(`https://ipfs.io/ipfs/${ipfsHash}`);
            return response.data;
        }

        // Handle GitHub raw URLs
        if (metaUrl.includes('raw.githubusercontent.com')) {
            const response = await axios.get(metaUrl);
            return response.data;
        }

        // Handle regular URLs
        const response = await axios.get(metaUrl);
        return response.data;
    } catch (error) {
        console.error(`Error fetching metadata from ${metaUrl}:`, error.message);
        return null;
    }
}

async function getProposalDetails(drepId) {
    try {
        const apiKey = process.env.KOIOS_API_KEY;
        if (!apiKey) {
            throw new Error('KOIOS_API_KEY environment variable is not set');
        }

        const response = await axios.get(`https://api.koios.rest/api/v1/voter_proposal_list?_voter_id=${drepId}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        });

        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response format: expected an array');
        }

        console.log(`Found ${response.data.length} proposals in voter_proposal_list`);

        // Create a map of proposal details by proposal_id
        const proposalMap = response.data.reduce((acc, proposal) => {
            if (!proposal.proposal_id) {
                console.warn('Found proposal without proposal_id, skipping');
                return acc;
            }
            acc[proposal.proposal_id] = proposal;
            return acc;
        }, {});

        console.log(`Successfully mapped ${Object.keys(proposalMap).length} proposals`);
        return proposalMap;
    } catch (error) {
        console.error('Error fetching proposal details:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return {};
    }
}

// Function to fetch rationale from Cardano governance repository
async function fetchGovernanceRationale(proposalId, year = null, epoch = null) {
    try {
        const baseUrl = 'https://raw.githubusercontent.com/MeshJS/governance/refs/heads/main/vote-context';
        console.log(`\nFetching rationale for proposal ${proposalId} (year: ${year}, epoch: ${epoch})`);

        // Extract the shortened ID (last 4 characters) from the proposal ID
        const shortenedId = proposalId.slice(-4);

        // If we have year and epoch, try the direct path first
        if (year && epoch) {
            const directUrl = `${baseUrl}/${year}/${epoch}_${shortenedId}/Vote_Context.jsonId`;
            try {
                const response = await axios.get(directUrl, { responseType: 'text' });
                if (response.data) {
                    // First try to parse as JSON (cleaner if it works)
                    try {
                        const normalizedRaw = response.data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                        const parsedData = JSON.parse(normalizedRaw);
                        if (parsedData?.body?.comment && typeof parsedData.body.comment === 'string') {
                            return parsedData.body.comment.trim();
                        }
                    } catch (parseError) {
                        // JSON parsing failed, try regex extraction as fallback
                        const commentMatches = [...response.data.matchAll(/"comment"\s*:\s*"([\s\S]*?)"\s*(,|\n|\r|})/g)];
                        if (commentMatches.length > 0) {
                            let commentRaw = commentMatches[commentMatches.length - 1][1];
                            // Unescape escaped quotes and backslashes
                            commentRaw = commentRaw.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\/g, '\\');
                            return commentRaw.trim();
                        }

                        // Final fallback: try with cleaned control characters
                        try {
                            const cleaned = response.data.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
                            const parsedData = JSON.parse(cleaned);
                            if (parsedData?.body?.comment && typeof parsedData.body.comment === 'string') {
                                return parsedData.body.comment.trim();
                            }
                        } catch (finalParseError) {
                            // All parsing attempts failed
                        }
                    }
                }
            } catch (error) {
                console.warn(`Direct path not found for proposal ${proposalId}, trying year folders`);
            }
        }

        // If direct path failed or we don't have year/epoch, try all possible combinations
        const currentYear = new Date().getFullYear();
        const years = year ? [year] : [currentYear]; // Only search current year if no year provided
        const epochs = epoch ? [epoch] : [];

        for (const currentYear of years) {
            // If we have a specific epoch, try that first
            if (epochs.length > 0) {
                for (const currentEpoch of epochs) {
                    const searchUrl = `${baseUrl}/${currentYear}/${currentEpoch}_${shortenedId}/Vote_Context.jsonId`;
                    try {
                        const response = await axios.get(searchUrl, { responseType: 'text' });
                        if (response.data) {
                            // First try to parse as JSON (cleaner if it works)
                            try {
                                const normalizedRaw = response.data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                                const parsedData = JSON.parse(normalizedRaw);
                                if (parsedData?.body?.comment && typeof parsedData.body.comment === 'string') {
                                    return parsedData.body.comment.trim();
                                }
                            } catch (parseError) {
                                // JSON parsing failed, try regex extraction as fallback
                                const commentMatches = [...response.data.matchAll(/"comment"\s*:\s*"([\s\S]*?)"\s*(,|\n|\r|})/g)];
                                if (commentMatches.length > 0) {
                                    let commentRaw = commentMatches[commentMatches.length - 1][1];
                                    // Unescape escaped quotes and backslashes
                                    commentRaw = commentRaw.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\/g, '\\');
                                    return commentRaw.trim();
                                }

                                // Final fallback: try with cleaned control characters
                                try {
                                    const cleaned = response.data.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
                                    const parsedData = JSON.parse(cleaned);
                                    if (parsedData?.body?.comment && typeof parsedData.body.comment === 'string') {
                                        return parsedData.body.comment.trim();
                                    }
                                } catch (finalParseError) {
                                    // All parsing attempts failed
                                }
                            }
                        }
                    } catch (error) {
                        // Continue to next combination
                        continue;
                    }
                }
            }

            // If no specific epoch or if specific epoch search failed, try a range of epochs
            const startEpoch = epoch || 500; // Start from epoch 500 if no specific epoch
            const endEpoch = epoch || 600;   // End at epoch 600 if no specific epoch

            for (let currentEpoch = startEpoch; currentEpoch <= endEpoch; currentEpoch++) {
                const searchUrl = `${baseUrl}/${currentYear}/${currentEpoch}_${shortenedId}/Vote_Context.jsonId`;
                try {
                    const response = await axios.get(searchUrl, { responseType: 'text' });
                    if (response.data) {
                        // First try to parse as JSON (cleaner if it works)
                        try {
                            const normalizedRaw = response.data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                            const parsedData = JSON.parse(normalizedRaw);
                            if (parsedData?.body?.comment && typeof parsedData.body.comment === 'string') {
                                return parsedData.body.comment.trim();
                            }
                        } catch (parseError) {
                            // JSON parsing failed, try regex extraction as fallback
                            const commentMatches = [...response.data.matchAll(/"comment"\s*:\s*"([\s\S]*?)"\s*(,|\n|\r|})/g)];
                            if (commentMatches.length > 0) {
                                let commentRaw = commentMatches[commentMatches.length - 1][1];
                                // Unescape escaped quotes and backslashes
                                commentRaw = commentRaw.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\/g, '\\');
                                return commentRaw.trim();
                            }

                            // Final fallback: try with cleaned control characters
                            try {
                                const cleaned = response.data.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
                                const parsedData = JSON.parse(cleaned);
                                if (parsedData?.body?.comment && typeof parsedData.body.comment === 'string') {
                                    return parsedData.body.comment.trim();
                                }
                            } catch (finalParseError) {
                                // All parsing attempts failed
                            }
                        }
                    }
                } catch (error) {
                    // Continue to next epoch
                    continue;
                }
            }
        }

        return null;
    } catch (error) {
        console.warn(`Could not fetch rationale from governance repository for proposal ${proposalId}:`, error.message);
        return null;
    }
}

async function upsertVotesToDatabase(votes) {
    try {
        console.log(`Upserting ${votes.length} votes to database...`);

        const { error } = await supabase
            .from('drep_votes')
            .upsert(votes, {
                onConflict: 'vote_tx_hash',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Error upserting votes to database:', error);
            throw error;
        }

        console.log(`Successfully upserted ${votes.length} votes to database`);
    } catch (error) {
        console.error('Failed to upsert votes to database:', error);
        throw error;
    }
}

async function getDRepVotes(drepId) {
    try {
        const apiKey = process.env.KOIOS_API_KEY;
        if (!apiKey) {
            throw new Error('KOIOS_API_KEY environment variable is not set');
        }

        // Fetch proposal details first
        const proposalDetails = await getProposalDetails(drepId);

        const response = await axios.get(`https://api.koios.rest/api/v1/vote_list?voter_id=eq.${encodeURIComponent(drepId)}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        });

        // Validate response data
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response format: expected an array');
        }

        console.log(`Found ${response.data.length} votes for DRep ${drepId}`);

        // Process and validate each vote
        const processedVotes = [];

        for (const vote of response.data) {
            // Validate required fields
            if (!vote.proposal_id || !vote.vote || !vote.block_time) {
                console.error('Invalid vote data: missing required fields');
                continue;
            }

            // Validate vote enum value
            const validVotes = ['Yes', 'No', 'Abstain'];
            if (!validVotes.includes(vote.vote)) {
                console.error(`Invalid vote value: ${vote.vote}. Must be one of: ${validVotes.join(', ')}`);
                continue;
            }

            // Fetch metadata if metaUrl is available
            let metadata = null;
            if (vote.meta_url) {
                metadata = await fetchMetadata(vote.meta_url);
            }

            // Get proposal details
            const proposal = proposalDetails[vote.proposal_id] || {};

            // Try to get rationale from multiple sources in order of preference
            let rationale = null;

            // First try the missing rationales file
            if (missingRationales[vote.proposal_id]?.rationale) {
                rationale = missingRationales[vote.proposal_id].rationale;
                console.log(`Fetching rationale from missing rationales: ${rationale}`);
            }
            // Then try metadata
            else if (metadata?.body?.comment) {
                rationale = metadata.body.comment;
                console.log(`Fetching rationale from metadata: ${rationale}`);
            }
            else if (metadata?.body?.rationale) {
                rationale = metadata.body.rationale;
                console.log(`Fetching rationale from metadata: ${rationale}`);
            }
            // Finally try governance repository as last resort
            else {
                const year = new Date(vote.block_time * 1000).getFullYear();
                const epoch = proposal.proposed_epoch;
                rationale = await fetchGovernanceRationale(vote.proposal_id, year, epoch);
                console.log(`Fetching rationale from governance repository: ${rationale}`);
            }

            // Add proposal details to vote
            let proposalTitle = proposal.meta_json?.body?.title;

            // If title not found in meta_json, try fetching from meta_url
            if (!proposalTitle && proposal.meta_url) {
                const metadata = await fetchMetadata(proposal.meta_url);
                if (metadata?.body?.title) {
                    proposalTitle = metadata.body.title;
                }
            }

            const processedVote = {
                vote_tx_hash: vote.vote_tx_hash,
                drep_id: drepId,
                proposal_id: vote.proposal_id,
                proposal_tx_hash: vote.proposal_tx_hash + '00',
                proposal_index: vote.proposal_index,
                vote: vote.vote,
                block_time: new Date(vote.block_time * 1000).toISOString(),
                meta_url: vote.meta_url,
                meta_hash: vote.meta_hash,
                proposal_title: proposalTitle || missingRationales[vote.proposal_id]?.title || 'Unknown Proposal',
                proposal_type: proposal.proposal_type || 'Unknown',
                proposed_epoch: proposal.proposed_epoch || null,
                expiration_epoch: proposal.expiration || null,
                rationale: rationale || 'No rationale available'
            };

            processedVotes.push(processedVote);
        }

        // Upsert votes to database
        if (processedVotes.length > 0) {
            await upsertVotesToDatabase(processedVotes);
        }

        console.log(`Successfully processed ${processedVotes.length} votes for DRep ${drepId}`);
    } catch (error) {
        console.error('Error fetching DRep votes:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        process.exit(1);
    }
}

getDRepVotes(drepId); 