import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { DRepVote, DRepVotesResponse } from '../../../types';

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

        // Calculate freshness for the data and group by year
        const now = new Date();
        const votes = data.map((vote: DRepVote) => {
            const voteTime = new Date(vote.block_time);
            const timeDiff = now.getTime() - voteTime.getTime();
            const isRecent = timeDiff < 5 * 60 * 1000; // Consider "recent" if within last 5 minutes

            return {
                ...vote,
                isRecent,
                timeSinceVote: Math.floor(timeDiff / 1000) // seconds
            };
        });

        // Group votes by year
        const yearlyVotes: Record<string, DRepVote[]> = {};
        votes.forEach((vote) => {
            const voteYear = new Date(vote.block_time).getFullYear();
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
        } else if (votes.some((v: DRepVote & { isRecent: boolean }) => !v.isRecent)) {
            status = 'stale';
            message = 'Some votes may be outdated';
        }

        const response: DRepVotesResponse = {
            status,
            message,
            hasData: votes.length > 0,
            yearlyVotes,
            totalVotes: votes.length,
            drepId: drepIdString
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