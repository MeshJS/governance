import { BaseApi } from './baseApi';
import { GovernanceProposal } from '../../../types/governance';

export class GovernanceProposalsApi extends BaseApi<GovernanceProposal> {
    constructor() {
        super({
            tableName: 'governance_proposals',
            primaryKey: 'proposal_id',
            orderBy: {
                column: 'created_at',
                ascending: false
            }
        });
    }

    async fetchAndUpdate(): Promise<GovernanceProposal[]> {
        return this.fetchFromSupabase();
    }
} 