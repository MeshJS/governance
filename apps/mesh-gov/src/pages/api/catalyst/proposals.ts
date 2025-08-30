import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { CatalystProposal, CatalystProposalsResponse } from '../../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectIds, since } = req.query;

  if (!projectIds) {
    return res.status(400).json({
      error: 'Missing projectIds parameter',
    });
  }

  // Ensure projectIds is a string and parse comma-separated values
  const projectIdsString = Array.isArray(projectIds) ? projectIds[0] : String(projectIds);
  const projectIdsArray = projectIdsString.split(',').map(id => id.trim());

  try {
    // Build query to get the proposals for the specified project IDs
    let query = supabase.from('catalyst_proposals').select('*').in('project_id', projectIdsArray);

    // If 'since' parameter is provided, only return results updated after that timestamp
    if (since) {
      const sinceDate = new Date(since as string);
      if (!isNaN(sinceDate.getTime())) {
        query = query.gt('updated_at', sinceDate.toISOString());
      }
    }

    // Get the records
    const { data, error } = await query;

    if (error) {
      console.error('❌ Failed to query Supabase:', error);
      return res.status(500).json({
        error: 'Failed to query database',
        details: error.message,
      });
    }

    // Check if we have data for all requested project IDs
    const foundProjectIds = data.map((proposal: CatalystProposal) => proposal.project_id);
    const missingProjectIds = projectIdsArray.filter(id => !foundProjectIds.includes(id));

    // Calculate freshness for each proposal
    const now = new Date();
    const proposals = data.map((proposal: CatalystProposal) => {
      const lastUpdated = new Date(proposal.updated_at);
      const timeDiff = now.getTime() - lastUpdated.getTime();
      const isRecent = timeDiff < 5 * 60 * 1000; // Consider "recent" if updated within last 5 minutes

      return {
        ...proposal,
        isRecent,
        timeSinceUpdate: Math.floor(timeDiff / 1000), // seconds
      };
    });

    // Determine overall status
    let status: 'completed' | 'partial' | 'stale' = 'completed';
    let message = 'All proposals are up to date';

    if (missingProjectIds.length > 0) {
      status = 'partial';
      message = `Some proposals not found: ${missingProjectIds.join(', ')}`;
    } else if (proposals.some((p: CatalystProposal) => !p.isRecent)) {
      status = 'stale';
      message = 'Some proposals may be outdated';
    }

    const response: CatalystProposalsResponse = {
      status,
      message,
      hasData: proposals.length > 0,
      proposals,
      missingProjectIds,
      totalRequested: projectIdsArray.length,
      totalFound: proposals.length,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('❌ Failed to check catalyst proposals:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
