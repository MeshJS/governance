import { BaseApi } from './baseApi';
import { ChainTip } from '../../types/network';

export class ChainTipApi extends BaseApi<ChainTip> {
    constructor() {
        super({
            tableName: 'chain_tip',
            primaryKey: 'epoch_no',
            orderBy: {
                column: 'epoch_no',
                ascending: false
            }
        });
    }

    async fetchFromKoios(): Promise<ChainTip> {
        const data = await this.fetchFromExternalApi('/api/koios-chain-tip');
        console.log('Fetched chain tip from Koios:', data);
        return data[0]; // The API returns an array with a single item
    }

    async fetchAndUpdate(): Promise<ChainTip> {
        console.log('Fetching chain tip from Koios');
        return this.fetchFromKoios();
    }
} 