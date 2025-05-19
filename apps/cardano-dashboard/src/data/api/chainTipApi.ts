import { ChainTip } from '../../types/network';

export class ChainTipApi {
    async fetchFromKoios(): Promise<ChainTip> {
        const url = '/api/koios-chain-tip';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chain tip');
        const data = await response.json();
        return data[0];
    }

    async fetchAndUpdate(): Promise<ChainTip> {
        return this.fetchFromKoios();
    }
} 