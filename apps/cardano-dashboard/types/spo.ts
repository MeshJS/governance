export interface SPORelay {
    dns?: string;
    srv?: string;
    ipv4?: string;
    ipv6?: string;
    port?: number;
}

export interface PoolMetadata {
    name?: string;
    description?: string;
    ticker?: string;
    homepage?: string;
    extended?: string;
}

export interface DetailedPoolInfo {
    pool_id_bech32: string;
    vrf_key_hash: string;
    reward_addr_delegated_drep: string | null;
    meta_json: PoolMetadata;
    op_cert: string;
    op_cert_counter: number;
    sigma: number;
    block_count: number;
    live_pledge: string;
    live_stake: string;
    live_delegators: number;
    live_saturation: number;
    voting_power: string;
}

export interface SPOData {
    pool_id_bech32: string;
    pool_id_hex: string;
    active_epoch_no: number;
    margin: number;
    fixed_cost: string;
    pledge: string;
    deposit: string;
    reward_addr: string;
    owners: string[];
    relays: SPORelay[];
    ticker: string;
    pool_group: string;
    meta_url: string;
    meta_hash: string;
    pool_status: string;
    active_stake: string;
    retiring_epoch: number;
    updated_at?: string;
    // Detailed pool info fields
    vrf_key_hash?: string;
    reward_addr_delegated_drep?: string | null;
    meta_json?: PoolMetadata;
    op_cert?: string;
    op_cert_counter?: number;
    sigma?: number;
    block_count?: number;
    live_pledge?: string;
    live_stake?: string;
    live_delegators?: number;
    live_saturation?: number;
    voting_power?: string;
    // Location data
    location?: {
        lat: number;
        lng: number;
    };
} 