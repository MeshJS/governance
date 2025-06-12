import { ChainTip } from '../../../types/network';

export class ChainTipApi {
    async fetchFromKoios(): Promise<ChainTip[]> {
        const url = '/api/koios-chain-tip';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chain tip');
        const data = await response.json();

        // Validate that we received an array
        if (!Array.isArray(data)) {
            throw new Error('Invalid chain tip data format');
        }

        // Validate that we have at least one item
        if (data.length === 0) {
            throw new Error('No chain tip data received');
        }

        // Validate the first item has the required properties
        const firstItem = data[0];
        if (!this.isValidChainTip(firstItem)) {
            throw new Error('Invalid chain tip data structure');
        }

        return data;
    }

    private isValidChainTip(data: unknown): data is ChainTip {
        return (
            typeof data === 'object' &&
            data !== null &&
            'epoch_no' in data &&
            'hash' in data &&
            'abs_slot' in data &&
            'epoch_slot' in data &&
            'block_time' in data &&
            'block_height' in data &&
            typeof (data as ChainTip).epoch_no === 'number' &&
            typeof (data as ChainTip).hash === 'string' &&
            typeof (data as ChainTip).abs_slot === 'number' &&
            typeof (data as ChainTip).epoch_slot === 'number' &&
            typeof (data as ChainTip).block_time === 'number' &&
            typeof (data as ChainTip).block_height === 'number'
        );
    }

    async fetchAndUpdate(): Promise<ChainTip[]> {
        return this.fetchFromKoios();
    }
} 