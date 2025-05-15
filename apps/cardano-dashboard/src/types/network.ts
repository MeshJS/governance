import { BaseData } from '@/types/base';

export interface ChainTip extends BaseData {
    epoch_no: number;
    hash: string;
    block_time: number;
    block_height: number;
    slot_no: number;
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
}

export type NetworkTotalsResponse = NetworkTotals[];
export type ChainTipResponse = ChainTip[]; 