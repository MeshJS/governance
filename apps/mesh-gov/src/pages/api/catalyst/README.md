# Catalyst Proposals API

This API route fetches Catalyst proposal data from the Supabase database based on project IDs.

## Endpoint

```
GET /api/catalyst/proposals
```

## Query Parameters

- `projectIds` (required): Comma-separated list of project IDs
- `since` (optional): ISO timestamp to only fetch proposals updated after this time

## Example Usage

### Fetch multiple proposals
```bash
GET /api/catalyst/proposals?projectIds=1000107,1100271,1200148
```

### Fetch proposals updated after a specific time
```bash
GET /api/catalyst/proposals?projectIds=1000107&since=2024-01-01T00:00:00Z
```

## Response Format

```typescript
interface CatalystProposalsResponse {
    status: 'completed' | 'partial' | 'stale';
    message: string;
    hasData: boolean;
    proposals: CatalystProposal[];
    missingProjectIds: string[];
    totalRequested: number;
    totalFound: number;
}

interface CatalystProposal {
    id: number;
    title: string;
    budget: number;
    milestones_qty: number;
    funds_distributed: number;
    project_id: string;
    challenges: any;
    name: string;
    category: string;
    category_slug: string | null;
    fund_number: string | null;
    url: string;
    status: string;
    finished: string;
    voting: CatalystProposalVoting | null;
    milestones_completed: number;
    updated_at: string;
    isRecent?: boolean;
    timeSinceUpdate?: number;
}

interface CatalystProposalVoting {
    proposalId: number;
    yes_votes_count: number;
    no_votes_count: number;
    abstain_votes_count: number;
    unique_wallets: number;
}
```

## Response Status

- `completed`: All requested proposals found and data is recent
- `partial`: Some proposals not found in database
- `stale`: All proposals found but some data may be outdated

## Client Usage

Use the utility functions in `src/lib/fetchCatalystProposals.ts`:

```typescript
import { fetchCatalystProposals, fetchCatalystProposal } from '../lib/fetchCatalystProposals';

// Fetch multiple proposals
const response = await fetchCatalystProposals(['1000107', '1100271']);

// Fetch single proposal
const response = await fetchCatalystProposal('1000107');

// Fetch with since parameter
const response = await fetchCatalystProposals(['1000107'], '2024-01-01T00:00:00Z');
```

## Data Source

This API fetches data from the `catalyst_proposals` table in Supabase, which is populated by the background function `catalyst-proposals-background.mts` in the shared-backend application.

## Error Handling

- `400`: Missing or invalid `projectIds` parameter
- `405`: Method not allowed (only GET is supported)
- `500`: Database error or internal server error

## Example Component

See `src/components/CatalystProposalsExample.tsx` for a complete example of how to use this API in a React component. 