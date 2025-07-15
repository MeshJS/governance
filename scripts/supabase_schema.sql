

-- Table for voting power history by epoch
CREATE TABLE drep_voting_power_history (
    drep_id VARCHAR(255) NOT NULL REFERENCES drep_data(drep_id),
    epoch_no INTEGER NOT NULL,
    voting_power_lovelace BIGINT NOT NULL,
    total_delegators INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (drep_id, epoch_no)
);

-- Table for current delegation summary
CREATE TABLE drep_delegation_summary (
    drep_id VARCHAR(255) PRIMARY KEY REFERENCES drep_data(drep_id),
    current_epoch INTEGER NOT NULL,
    total_delegators INTEGER NOT NULL DEFAULT 0,
    total_amount_ada DECIMAL(20,6) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for DRep votes on governance proposals
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


