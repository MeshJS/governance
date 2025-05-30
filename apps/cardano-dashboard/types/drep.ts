export interface DRepBasicData {
    drep_id: string;
    hex: string;
    has_script: boolean;
    registered: boolean;
}

export interface DRepDelegator {
    stake_address: string;
    stake_address_hex: string;
    script_hash: string | null;
    epoch_no: number;
    amount: string;
}

interface DRepMetadataBody {
    doNotList: boolean;
    givenName: { '@value': string };
    objectives: { '@value': string };
    image?: {
        '@type': string;
        contentUrl: string;
    };
    references: Array<{
        uri?: string;
        Link?: string;
        Other?: string;
        label?: string;
        Identity?: string;
        referenceHash?: {
            hashDigest: string;
            hashAlgorithm: string;
        };
        GovernanceMetadata?: string;
    }>;
    motivations: { '@value': string };
    paymentAddress: { '@value': string };
    qualifications: { '@value': string };
}

interface DRepMetadataContext {
    body: {
        '@id': string;
        '@context': {
            image: string;
            doNotList: string;
            givenName: string;
            objectives: string;
            references: {
                '@id': string;
                '@context': {
                    uri: string;
                    Link: string;
                    Other: string;
                    label: string;
                    Identity: string;
                    referenceHash: {
                        '@id': string;
                        '@context': {
                            hashDigest: string;
                            hashAlgorithm: string;
                        };
                    };
                    GovernanceMetadata: string;
                };
                '@container': string;
            };
            motivations: string;
            paymentAddress: string;
            qualifications: string;
        };
    };
    CIP100: string;
    CIP119: string;
    authors: {
        '@id': string;
        '@context': {
            name: string;
            witness: {
                '@id': string;
                '@context': {
                    publicKey: string;
                    signature: string;
                    witnessAlgorithm: string;
                };
            };
        };
        '@container': string;
    };
    '@language': string;
    hashAlgorithm: string;
}

export interface DRepMetadata {
    body: DRepMetadataBody;
    authors: Array<{
        name?: string;
        witness?: {
            publicKey: string;
            signature: string;
            witnessAlgorithm: string;
        };
    }>;
    '@context': DRepMetadataContext;
    hashAlgorithm: { '@value': string };
}

export interface DRepDetailedData extends DRepBasicData {
    deposit: string;
    active: boolean;
    expires_epoch_no: number;
    amount: string;
    meta_url: string | null;
    meta_hash: string | null;
    meta_json: DRepMetadata | null;
    meta_bytes: string | null;
    meta_warning: string | null;
    meta_language: string | null;
    meta_comment: string | null;
    meta_is_valid: boolean | null;
    updated_at?: string;
    delegators: DRepDelegator[];
    total_delegators: number;
    total_delegated_amount: string;
} 