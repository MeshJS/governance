import { BaseApi } from './baseApi';
import { GovernanceProposal, GovernanceProposalResponse, VotingSummary, VotingSummaryResponse } from '../../types/governance';
import { ChainTip } from '../../types/network';

export class GovernanceProposalsApi extends BaseApi<GovernanceProposal> {
    private readonly RECENT_EXPIRY_EPOCHS = 5;

    constructor() {
        super({
            tableName: 'governance_proposals',
            primaryKey: 'proposal_id',
            orderBy: {
                column: 'proposed_epoch',
                ascending: false
            }
        });
    }

    async fetchFromKoios(): Promise<GovernanceProposalResponse> {
        const data = await this.fetchFromExternalApi('/api/koios-governance');
        console.log('Fetched from Koios:', data.length, 'proposals');
        return data;
    }

    async fetchVotingSummary(proposalId: string): Promise<VotingSummary> {
        console.log('Fetching voting summary for proposal:', proposalId);
        const url = `/api/koios-governance-voting-summary?_proposal_id=${proposalId}`;
        const response = await this.fetchFromExternalApi(url);
        console.log('Voting summary response:', response);
        return response[0]; // The API returns an array with a single item
    }

    private isProposalActive(proposal: GovernanceProposal, currentEpoch: number): boolean {
        // A proposal is active if it hasn't expired and hasn't been enacted/dropped
        return (
            proposal.expired_epoch === null &&
            proposal.enacted_epoch === null &&
            proposal.dropped_epoch === null &&
            proposal.voting_end_epoch >= currentEpoch
        );
    }

    private isProposalRecentlyExpired(proposal: GovernanceProposal, currentEpoch: number): boolean {
        // Check if proposal expired within the last RECENT_EXPIRY_EPOCHS epochs
        if (proposal.expired_epoch === null) return false;
        return currentEpoch - proposal.expired_epoch <= this.RECENT_EXPIRY_EPOCHS;
    }

    private shouldUpdateVotingSummary(proposal: GovernanceProposal, currentEpoch: number): boolean {
        return this.isProposalActive(proposal, currentEpoch) ||
            this.isProposalRecentlyExpired(proposal, currentEpoch);
    }

    private async enrichProposalsWithVotingSummary(
        proposals: GovernanceProposal[],
        currentEpoch: number
    ): Promise<GovernanceProposal[]> {
        console.log('Enriching', proposals.length, 'proposals with voting summaries');
        const enrichedProposals = await Promise.all(
            proposals.map(async (proposal) => {
                try {
                    // Fetch voting summary for active or recently expired proposals
                    if (this.shouldUpdateVotingSummary(proposal, currentEpoch)) {
                        const votingSummary = await this.fetchVotingSummary(proposal.proposal_id);
                        console.log('Enriched proposal', proposal.proposal_id, 'with voting summary:', votingSummary);
                        return {
                            ...proposal,
                            ...votingSummary
                        };
                    }
                    return proposal;
                } catch (error) {
                    console.error(`Error fetching voting summary for proposal ${proposal.proposal_id}:`, error);
                    return proposal;
                }
            })
        );
        console.log('Finished enriching proposals');
        return enrichedProposals;
    }

    async fetchAndUpdate(chainTip: ChainTip): Promise<GovernanceProposal[]> {
        console.log('Starting fetchAndUpdate');
        // First, fetch all data from Supabase
        const supabaseData = await this.fetchFromSupabase();
        console.log('Fetched from Supabase:', supabaseData.length, 'proposals');

        if (supabaseData.length === 0) {
            console.log('No data in Supabase, fetching from Koios');
            // If no data in Supabase, fetch all from Koios
            const koiosData = await this.fetchFromKoios();
            const enrichedData = await this.enrichProposalsWithVotingSummary(koiosData, chainTip.epoch_no);
            console.log('Upserting enriched data to Supabase');
            await this.upsertToSupabase(enrichedData);
            return enrichedData;
        }

        // Fetch all proposals from Koios
        const koiosData = await this.fetchFromKoios();

        // Find new or updated proposals
        const newOrUpdatedProposals = koiosData.filter(koiosProposal => {
            const existingProposal = supabaseData.find(p => p.proposal_id === koiosProposal.proposal_id);
            if (!existingProposal) return true; // New proposal

            // Check if any field has changed
            return Object.keys(koiosProposal).some(key => {
                if (key === 'created_at' || key === 'updated_at') return false;
                return JSON.stringify(koiosProposal[key as keyof GovernanceProposal]) !==
                    JSON.stringify(existingProposal[key as keyof GovernanceProposal]);
            });
        });

        console.log('Found', newOrUpdatedProposals.length, 'new or updated proposals');

        if (newOrUpdatedProposals.length > 0) {
            // Enrich new/updated proposals with voting summaries
            const enrichedProposals = await this.enrichProposalsWithVotingSummary(newOrUpdatedProposals, chainTip.epoch_no);
            console.log('Upserting enriched proposals to Supabase');
            await this.upsertToSupabase(enrichedProposals);

            // Merge the updated data with existing data
            const updatedData = [...supabaseData];
            enrichedProposals.forEach(proposal => {
                const index = updatedData.findIndex(p => p.proposal_id === proposal.proposal_id);
                if (index >= 0) {
                    updatedData[index] = proposal;
                } else {
                    updatedData.push(proposal);
                }
            });

            const sortedData = updatedData.sort((a, b) => b.proposed_epoch - a.proposed_epoch);
            console.log('Returning', sortedData.length, 'proposals with voting summaries');
            return sortedData;
        }

        // Even if no new proposals, we should update voting summaries for active or recently expired proposals
        const proposalsToUpdate = supabaseData.filter(p => this.shouldUpdateVotingSummary(p, chainTip.epoch_no));
        if (proposalsToUpdate.length > 0) {
            console.log('Updating voting summaries for', proposalsToUpdate.length, 'proposals');
            const enrichedProposals = await this.enrichProposalsWithVotingSummary(proposalsToUpdate, chainTip.epoch_no);
            await this.upsertToSupabase(enrichedProposals);

            // Merge the updated proposals with the rest of the data
            const updatedData = [...supabaseData];
            enrichedProposals.forEach(proposal => {
                const index = updatedData.findIndex(p => p.proposal_id === proposal.proposal_id);
                if (index >= 0) {
                    updatedData[index] = proposal;
                }
            });

            return updatedData.sort((a, b) => b.proposed_epoch - a.proposed_epoch);
        }

        console.log('No updates needed, returning existing data');
        return supabaseData;
    }
} 