export interface SPORelay {
    dns?: string;
    srv?: string;
    ipv4?: string;
    ipv6?: string;
    port?: number;
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
} 