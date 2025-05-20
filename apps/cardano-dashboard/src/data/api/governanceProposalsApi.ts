import { BaseApi } from './baseApi';
import { GovernanceProposal } from '../../../types/governance';
import { ChainTip } from '../../../types/network';

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

    async fetchAndUpdate(chainTip?: ChainTip): Promise<GovernanceProposal[]> {
        return this.fetchFromSupabase();
    }
} 