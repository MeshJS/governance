import { ChainTip } from '../../../types/network';

export class ChainTipApi {
    async fetchFromKoios(): Promise<ChainTip[]> {
        const url = '/api/koios-chain-tip';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn('Failed to fetch chain tip: HTTP', response.status);
                return [];
            }

            const isStale = response.headers.get('x-data-stale') === 'true';
            const lastUpdated = response.headers.get('x-last-updated');
            if (isStale) {
                console.warn('Chain tip served from stale cache', lastUpdated ? `(${lastUpdated})` : '');
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0 && this.isValidChainTip(data[0])) {
                console.info('Chain tip fetch successful', isStale ? '(stale)' : '(fresh)');
                return data;
            }

            console.warn('Chain tip response invalid or empty; returning empty array');
            return [];
        } catch (error) {
            console.error('Error fetching chain tip:', error);
            return [];
        }
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