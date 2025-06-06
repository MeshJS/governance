interface MetaContext {
    "@language"?: string;
    CIP100?: string;
    CIP108?: string;
    hashAlgorithm?: string;
    body?: {
        "@id"?: string;
        "@context"?: {
            references?: {
                "@id"?: string;
                "@container"?: string;
                "@context"?: {
                    GovernanceMetadata?: string;
                    Other?: string;
                    label?: string;
                    uri?: string;
                    referenceHash?: {
                        "@id"?: string;
                        "@context"?: {
                            hashDigest?: string;
                            hashAlgorithm?: string;
                        };
                    };
                };
            };
            title?: string;
            abstract?: string;
            motivation?: string;
            rationale?: string;
        };
    };
    authors?: {
        "@id"?: string;
        "@container"?: string;
        "@context"?: {
            name?: string;
            witness?: {
                "@id"?: string;
                "@context"?: {
                    witnessAlgorithm?: string;
                    publicKey?: string;
                    signature?: string;
                };
            };
        };
    };
}

interface MetaBody {
    abstract?: string;
    motivation?: string;
    rationale?: string;
    title?: string;
}

interface MetaJson {
    "@context"?: MetaContext;
    authors?: Array<{
        name?: string;
        witness?: {
            witnessAlgorithm?: string;
            publicKey?: string;
            signature?: string;
        };
    }>;
    hashAlgorithm?: string;
    body?: MetaBody;
}

export interface GovernanceProposal {
    proposal_id: string;
    title: string;
    description: string;
    expiration: number;
    created_at: string;
    updated_at: string;
    meta_url: string | null;
    meta_json: MetaJson | null;
}

export type GovernanceProposalResponse = GovernanceProposal[];

export interface VotingSummary {
    proposal_id: string;
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
    total_votes: number;
}

export type VotingSummaryResponse = VotingSummary[]; 