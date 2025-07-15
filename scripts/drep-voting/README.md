# DRep Voting Database System

This system fetches DRep voting data from the Koios API and stores it in a Supabase database instead of creating JSON files.

## Database Schema

### New Table: `drep_votes`

The system uses a new table `drep_votes` with the following structure:

```sql
CREATE TABLE drep_votes (
    vote_tx_hash VARCHAR(255) PRIMARY KEY,
    drep_id VARCHAR(255) NOT NULL REFERENCES drep_data(drep_id),
    proposal_id VARCHAR(255) NOT NULL REFERENCES governance_proposals(proposal_id),
    proposal_tx_hash VARCHAR(255) NOT NULL,
    proposal_index INTEGER NOT NULL,
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('Yes', 'No', 'Abstain')),
    block_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meta_url TEXT,
    meta_hash VARCHAR(255),
    proposal_title TEXT,
    proposal_type VARCHAR(50),
    proposed_epoch INTEGER,
    expiration_epoch INTEGER,
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance

```sql
CREATE INDEX idx_drep_votes_drep_id ON drep_votes(drep_id);
CREATE INDEX idx_drep_votes_proposal_id ON drep_votes(proposal_id);
CREATE INDEX idx_drep_votes_block_time ON drep_votes(block_time);
CREATE INDEX idx_drep_votes_vote ON drep_votes(vote);
```

## Setup

### 1. Database Setup

Run the SQL schema in your Supabase database:

```bash
# Copy the contents of scripts/supabase_schema.sql and run it in your Supabase SQL editor
```

### 2. Environment Variables

Ensure the following environment variables are set:

```env
KOIOS_API_KEY=your_koios_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Configuration

Update `config.json` with your DRep information:

```json
{
    "drepId": "your_drep_id",
    "organizationName": "your_organization_name"
}
```

## Usage

### Test Database Connection

```bash
node scripts/drep-voting/setup-database.js
```

### Run Voting Action

```bash
node scripts/drep-voting/voting-action.js
```

## GitHub Action

The GitHub Action (`mesh-gov-drep-voting.yml`) runs twice daily and:

1. Fetches DRep voting data from Koios API
2. Processes and enriches the data with metadata and rationales
3. Upserts the data to the `drep_votes` table in Supabase

## Data Flow

1. **Fetch Votes**: Gets voting data from Koios API for the configured DRep
2. **Enrich Data**: Fetches proposal details and metadata
3. **Get Rationales**: Attempts to find voting rationales from multiple sources:
   - Missing rationales file
   - Proposal metadata
   - Governance repository
4. **Database Storage**: Upserts processed votes to `drep_votes` table

## Data Sources

### Primary Sources
- **Koios API**: Voting data and proposal information
- **Supabase**: Existing `drep_data` and `governance_proposals` tables

### Rationale Sources (in order of preference)
1. Missing rationales file (`voting-history/missing-voting-rationales/rationales.json`)
2. Proposal metadata (`meta_url`)
3. Governance repository (MeshJS/governance)

## Benefits of Database Approach

1. **Real-time Access**: Data is immediately available for applications
2. **Relational Integrity**: Foreign key relationships ensure data consistency
3. **Query Performance**: Indexed columns enable fast queries
4. **Scalability**: Can handle large volumes of voting data
5. **Integration**: Easy to integrate with existing dashboard applications

## Migration from JSON Files

The system no longer creates JSON files. If you need to migrate existing JSON data:

1. Parse existing JSON files
2. Transform data to match the database schema
3. Use the `upsertVotesToDatabase` function to import data

## Error Handling

The system includes comprehensive error handling:

- API rate limiting with delays
- Graceful handling of missing metadata
- Database connection error handling
- Validation of vote data integrity

## Monitoring

Check the GitHub Action logs for:
- Number of votes processed
- Database upsert success/failure
- API errors and retries
- Missing data warnings 