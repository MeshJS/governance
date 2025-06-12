
export interface ChainTip {
    epoch_no: number;
    hash: string;
    abs_slot: number;
    epoch_slot: number;
    block_time: number;
    block_height: number;
}

export interface EpochInfo {
    epoch_no: number;
    out_sum: string;
    fees: string;
    tx_count: number;
    blk_count: number;
    start_time: number;
    end_time: number;
    first_block_time: number;
    last_block_time: number;
    active_stake: {
        amount: string;
    } | null;
    total_rewards: {
        amount: string;
    } | null;
    avg_blk_reward: {
        amount: string;
    } | null;
}

export interface NetworkTotals {
    epoch_no: number;
    circulation: string;
    treasury: string;
    reward: string;
    supply: string;
    reserves: string;
    fees: string;
    deposits_stake: string;
    deposits_drep: string;
    deposits_proposal: string;
    created_at?: string;
    updated_at?: string;
    // Epoch information
    out_sum: string;
    tx_count: number;
    blk_count: number;
    start_time: number;
    end_time: number;
    first_block_time: number;
    last_block_time: number;
    active_stake: {
        amount: string;
    } | null;
    total_rewards: {
        amount: string;
    } | null;
    avg_blk_reward: {
        amount: string;
    } | null;
    exchange_rate: number | null;
}

export type NetworkTotalsResponse = NetworkTotals[];
export type ChainTipResponse = ChainTip[];
export type EpochInfoResponse = EpochInfo[]; 