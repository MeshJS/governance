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
}

export interface NetworkTotalsResponse extends Array<NetworkTotals> { } 