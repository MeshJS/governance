import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const drepId = config.drepId;
const organizationName = config.organizationName;



if (!drepId) {
    console.error('DRep ID not found in config.json');
    process.exit(1);
}

if (!organizationName) {
    console.error('Organization name not found in config.json');
    process.exit(1);
}

// Create voting-history directory if it doesn't exist
const votingHistoryDir = path.join(__dirname, '..', 'voting-history');
if (!fs.existsSync(votingHistoryDir)) {
    fs.mkdirSync(votingHistoryDir, { recursive: true });
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

// Function to generate a single vote table
async function generateVoteTable(vote, proposalDetails, metadata, rationale) {
    const voteEmoji = vote.vote === 'Yes' ? '✅' : vote.vote === 'No' ? '❌' : '⚪';
    const voteText = `${voteEmoji}${vote.vote}`;

    // Get proposal details
    const proposal = proposalDetails[vote.proposalId] || {};

    // Extract proposal title from proposal details first, then fallback to metadata
    let proposalTitle = proposal.meta_json?.body?.title;

    // If title not found in meta_json, try fetching from meta_url
    if (!proposalTitle && proposal.meta_url) {
        const metadata = await fetchMetadata(proposal.meta_url);
        if (metadata?.body?.title) {
            proposalTitle = metadata.body.title;
        }
    }

    proposalTitle = proposalTitle || 'Unknown Proposal';

    // Format dates
    const submittedDate = vote.blockTime ? new Date(vote.blockTime).toLocaleDateString() : 'N/A';
    const proposedEpoch = proposal.proposed_epoch || 'N/A';
    const expirationEpoch = proposal.expiration || 'N/A';

    // Get proposal type
    const proposalType = proposal.proposal_type || 'Unknown';

    // Process rationale text to prevent table disruption
    let processedRationale = rationale || 'No rationale available';
    processedRationale = processedRationale.replace(/\n/g, ' ');
    processedRationale = processedRationale.replace(/\s+/g, ' ');
    processedRationale = processedRationale.replace(/\|/g, '\\|');
    /*if (processedRationale.length > 500) {
        processedRationale = processedRationale.substring(0, 497) + '...';
    }*/

    return `| ${organizationName}      | Cardano Governance Actions |
| -------------- | ------------------------------------------------------- |
| Proposal Title | [${proposalTitle}](https://adastat.net/governances/${vote.proposalTxHash || 'N/A'}) |
| Hash           | ${vote.proposalTxHash || 'N/A'} |
| Action ID      | ${vote.proposalId || 'N/A'} |
| Type           | ${proposalType} |
| Proposed Epoch | ${proposedEpoch} |
| Expires Epoch  | ${expirationEpoch} |
| Vote           | ${voteText} |
| Vote Submitted | ${submittedDate} |
| Rationale       | ${processedRationale} |
|Link|https://adastat.net/transactions/${vote.voteTxHash || 'N/A'} |`;
}

// Function to generate yearly markdown file
function generateYearlyMarkdown(votes, year) {
    const yearDir = path.join(votingHistoryDir, year.toString());
    if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
    }

    const yearFile = path.join(yearDir, `${year}-votes.md`);
    let content = `# DRep Voting History for ${year}\n\n`;

    // Sort votes by submission date
    votes.sort((a, b) => new Date(b.blockTime) - new Date(a.blockTime));

    // Add each vote table with a separator
    votes.forEach((vote, index) => {
        if (index > 0) {
            content += '\n\n---\n\n'; // Add separator between votes
        }
        content += vote.table + '\n';
    });

    fs.writeFileSync(yearFile, content);
    console.log(`Generated yearly markdown file: ${year}-votes.md`);
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

        // Group votes by year
        const votesByYear = {};

        // Process and validate each vote
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

            const processedVote = {
                proposalId: vote.proposal_id,
                proposalTxHash: vote.proposal_tx_hash + '00',
                proposalIndex: vote.proposal_index,
                voteTxHash: vote.vote_tx_hash,
                blockTime: new Date(vote.block_time * 1000).toISOString(),
                vote: vote.vote,
                metaUrl: vote.meta_url,
                metaHash: vote.meta_hash
            };

            // Fetch metadata if metaUrl is available
            let metadata = null;
            if (processedVote.metaUrl) {
                metadata = await fetchMetadata(processedVote.metaUrl);
            }

            // Get proposal details
            const proposal = proposalDetails[vote.proposal_id] || {};

            // Try to get rationale from multiple sources in order of preference
            let rationale = null;

            // First try metadata
            if (metadata?.body?.comment) {
                rationale = metadata.body.comment;
                console.log(`Fetching rationale from metadata: ${rationale}`);
            }
            else if (metadata?.body?.rationale) {
                rationale = metadata.body.rationale;
                console.log(`Fetching rationale from metadata: ${rationale}`);
            }
            // Then try governance repository as fallback
            else {
                const year = new Date(vote.block_time * 1000).getFullYear();
                const epoch = proposal.proposed_epoch;
                rationale = await fetchGovernanceRationale(vote.proposal_id, year, epoch);
                console.log(`Fetching rationale from governance repository: ${rationale}`);
            }

            // Generate vote table
            processedVote.table = await generateVoteTable(processedVote, proposalDetails, metadata, rationale);

            // Get year from blockTime
            const year = new Date(processedVote.blockTime).getFullYear();

            // Add to year group
            if (!votesByYear[year]) {
                votesByYear[year] = [];
            }
            votesByYear[year].push(processedVote);
        }

        // Generate markdown files for each year
        for (const [year, votes] of Object.entries(votesByYear)) {
            generateYearlyMarkdown(votes, parseInt(year));
        }

        console.log('All votes processed and organized by year successfully');
    } catch (error) {
        console.error('Error fetching DRep votes:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        process.exit(1);
    }
}

getDRepVotes(drepId); 