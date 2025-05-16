import { BaseData } from '@/types/base';

export interface ChainTip extends BaseData {
    epoch_no: number;
    hash: string;
    block_time: number;
    block_height: number;
    slot_no: number;
}

export interface EpochInfo extends BaseData {
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

export interface NetworkTotals extends BaseData {
    epoch_no: number;
    circulation: number;
    treasury: number;
    reward: number;
    supply: number;
    reserves: number;
    fees: number;
    deposits_stake: number;
    deposits_drep: number;
    deposits_proposal: number;
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
}

export type NetworkTotalsResponse = NetworkTotals[];
export type ChainTipResponse = ChainTip[];
export type EpochInfoResponse = EpochInfo[]; 