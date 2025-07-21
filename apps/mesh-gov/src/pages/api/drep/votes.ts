import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { DRepDelegationData } from '../../../types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { drepId } = req.query;

    if (!drepId) {
        return res.status(400).json({
            error: 'Missing drepId parameter'
        });
    }

    // Ensure drepId is a string
    const drepIdString = Array.isArray(drepId) ? drepId[0] : String(drepId);

    try {
        // Build query to get the votes for the specified DRep ID
        const { data, error } = await supabase
            .from('drep_votes')
            .select('*')
            .eq('drep_id', drepIdString)
            .order('block_time', { ascending: false });

        if (error) {
            console.error('❌ Failed to query Supabase:', error);
            return res.status(500).json({
                error: 'Failed to query database',
                details: error.message
            });
        }

        // Fetch delegation info for this DRep
        const { data: delegationInfo, error: delegationError } = await supabase
            .from('drep_delegation_info')
            .select('*')
            .eq('drep_id', drepIdString)
            .single();

        if (delegationError && delegationError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error('❌ Failed to query drep_delegation_info:', delegationError);
            return res.status(500).json({
                error: 'Failed to query delegation info',
                details: delegationError.message
            });
        }

        // Fetch drepInfo from drep_data
        const { data: drepInfoRow, error: drepInfoError } = await supabase
            .from('drep_data')
            .select('drep_id, amount, active, registered, expires_epoch_no, metadata_updated_at')
            .eq('drep_id', drepIdString)
            .single();

        if (drepInfoError && drepInfoError.code !== 'PGRST116') {
            console.error('❌ Failed to query drep_data:', drepInfoError);
            return res.status(500).json({
                error: 'Failed to query drep_data',
                details: drepInfoError.message
            });
        }

        // Calculate freshness for the data and group by year
        const now = new Date();
        const votes = data.map((vote: any) => {
            const voteTime = new Date(vote.block_time);
            const timeDiff = now.getTime() - voteTime.getTime();
            const isRecent = timeDiff < 5 * 60 * 1000; // Consider "recent" if within last 5 minutes

            // Map DB fields to GovernanceVote camelCase keys
            return {
                proposalId: vote.proposal_id,
                proposalTxHash: vote.proposal_tx_hash,
                proposalIndex: vote.proposal_index,
                voteTxHash: vote.vote_tx_hash,
                blockTime: vote.block_time,
                vote: vote.vote,
                metaUrl: vote.meta_url,
                metaHash: vote.meta_hash,
                proposalTitle: vote.proposal_title,
                proposalType: vote.proposal_type,
                proposedEpoch: vote.proposed_epoch,
                expirationEpoch: vote.expiration_epoch,
                rationale: vote.rationale,
                isRecent,
                timeSinceVote: Math.floor(timeDiff / 1000),
            };
        });

        // Group votes by year
        const yearlyVotes: Record<string, any[]> = {};
        votes.forEach((vote) => {
            const voteYear = new Date(vote.blockTime).getFullYear();
            const yearKey = `${voteYear}_voting`;

            if (!yearlyVotes[yearKey]) {
                yearlyVotes[yearKey] = [];
            }
            yearlyVotes[yearKey].push(vote);
        });

        // Determine overall status
        let status: 'completed' | 'partial' | 'stale' = 'completed';
        let message = 'DRep votes retrieved successfully';

        if (votes.length === 0) {
            status = 'partial';
            message = 'No votes found for this DRep';
        } else if (votes.some((v: any) => !v.isRecent)) {
            status = 'stale';
            message = 'Some votes may be outdated';
        }

        // Compose the delegationData object if available
        let delegationData: DRepDelegationData | null = null;
        if (delegationInfo) {
            delegationData = {
                timeline: {
                    epochs: delegationInfo.epochs,
                    current_epoch: delegationInfo.current_epoch,
                    total_delegators: delegationInfo.total_delegators,
                    total_amount_ada: delegationInfo.total_amount_ada,
                },
                drepInfo: drepInfoRow ? {
                    drepId: drepInfoRow.drep_id,
                    amount: drepInfoRow.amount,
                    active: drepInfoRow.active,
                    registered: drepInfoRow.registered,
                    expires_epoch_no: drepInfoRow.expires_epoch_no,
                    last_updated: drepInfoRow.metadata_updated_at || '',
                } : {
                    drepId: drepIdString,
                    amount: String(delegationInfo.total_amount_ada),
                    active: true,
                    registered: true,
                    expires_epoch_no: 0,
                    last_updated: '',
                },
            };
        }

        // Add a flat votes array for backward compatibility
        const flatVotes = votes;

        const response = {
            status,
            message,
            hasData: votes.length > 0,
            yearlyVotes,
            votes: flatVotes,
            totalVotes: votes.length,
            drepId: drepIdString,
            delegationData,
        };

        return res.status(200).json(response);
    } catch (err) {
        console.error('❌ Failed to fetch DRep votes:', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: err instanceof Error ? err.message : 'Unknown error'
        });
    }
} 