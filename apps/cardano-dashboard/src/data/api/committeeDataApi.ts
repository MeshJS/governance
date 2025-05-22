import { BaseApi } from './baseApi';
import { CommitteeMember } from '../../../types/committee';

export class CommitteeDataApi extends BaseApi<CommitteeMember> {
    constructor() {
        super({
            tableName: 'committee_data',
            primaryKey: 'cc_hot_id',
            orderBy: {
                column: 'expiration_epoch',
                ascending: true
            }
        });
    }

    async fetchAndUpdate(): Promise<CommitteeMember[]> {
        return this.fetchFromSupabase();
    }
} 