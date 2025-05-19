import { NextApiRequest, NextApiResponse } from 'next';

const KOIOS_API_URL = 'https://api.koios.rest/api/v1';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Received voting summary request:', req.query);

    if (req.method !== 'GET') {
        console.log('Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { _proposal_id } = req.query;

    if (!_proposal_id) {
        console.log('Missing proposal ID');
        return res.status(400).json({ error: 'Proposal ID is required' });
    }

    try {
        console.log('Fetching from Koios API:', `${KOIOS_API_URL}/proposal_voting_summary?_proposal_id=${_proposal_id}`);
        const response = await fetch(
            `${KOIOS_API_URL}/proposal_voting_summary?_proposal_id=${_proposal_id}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('Koios API error:', response.status, response.statusText);
            throw new Error(`Koios API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Koios API response:', data);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching voting summary:', error);
        res.status(500).json({ error: 'Failed to fetch voting summary' });
    }
} 