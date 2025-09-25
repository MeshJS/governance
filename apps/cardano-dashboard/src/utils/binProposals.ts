import { GovernanceProposal } from '../../types/governance';

export type VoteType = 'spo' | 'drep' | 'committee';

export interface ProposalBin {
    startIndex: number;
    endIndex: number; // inclusive
    count: number;
    yesVotes: number;
    noVotes: number;
    abstainVotes: number;
    yesPct: number;
    noPct: number;
}

function getVotesForType({ proposal, type }: { proposal: GovernanceProposal; type: VoteType; }) {
    if (type === 'committee') {
        return {
            yes: Number(proposal.committee_yes_votes_cast || 0),
            no: Number(proposal.committee_no_votes_cast || 0),
            abstain: Number(proposal.committee_abstain_votes_cast || 0)
        };
    }

    const prefix = type === 'spo' ? 'pool' : 'drep';
    const indexed = proposal as unknown as Record<string, unknown>;
    const yes = Number((indexed[`${prefix}_yes_votes_cast`] as number | string | null | undefined) ?? 0);
    const no = Number((indexed[`${prefix}_no_votes_cast`] as number | string | null | undefined) ?? 0);
    const abstain = Number((indexed[`${prefix}_abstain_votes_cast`] as number | string | null | undefined) ?? 0);
    return { yes, no, abstain };
}

export function binProposals({ proposals, type, maxColumns }: {
    proposals: Array<GovernanceProposal>;
    type: VoteType;
    maxColumns: number;
}): { bins: ProposalBin[] } {
    const total = proposals.length;
    const columns = Math.max(1, Math.min(maxColumns, total));

    // Fast path: one bin per proposal
    if (columns >= total) {
        const bins: ProposalBin[] = proposals.map((p, i) => {
            const { yes, no, abstain } = getVotesForType({ proposal: p, type });
            if (process.env.NODE_ENV !== 'production') {
                const values = { yes, no, abstain };
                const hasNonFinite = Object.values(values).some((v) => !Number.isFinite(v));
                if (hasNonFinite) {
                    console.warn('[binProposals] Non-finite vote value detected', { index: i, type, values, proposal: p });
                }
            }
            const sum = yes + no + abstain || 1;
            return {
                startIndex: i,
                endIndex: i,
                count: 1,
                yesVotes: yes,
                noVotes: no,
                abstainVotes: abstain,
                yesPct: (yes / sum) * 100,
                noPct: (no / sum) * 100
            };
        });
        return { bins };
    }

    // Aggregate into fixed number of bins based on index → bin mapping
    const bins: ProposalBin[] = Array.from({ length: columns }, () => ({
        startIndex: -1,
        endIndex: -1,
        count: 0,
        yesVotes: 0,
        noVotes: 0,
        abstainVotes: 0,
        yesPct: 0,
        noPct: 0
    }));

    for (let i = 0; i < total; i++) {
        const b = Math.min(columns - 1, Math.floor((i * columns) / total));
        const p = proposals[i];
        const { yes, no, abstain } = getVotesForType({ proposal: p, type });
        if (process.env.NODE_ENV !== 'production') {
            const values = { yes, no, abstain };
            const hasNonFinite = Object.values(values).some((v) => !Number.isFinite(v));
            if (hasNonFinite) {
                console.warn('[binProposals] Non-finite vote value detected', { index: i, binIndex: b, type, values, proposal: p });
            }
        }
        const bin = bins[b];
        if (bin.startIndex === -1) bin.startIndex = i;
        bin.endIndex = i;
        bin.count += 1;
        bin.yesVotes += yes;
        bin.noVotes += no;
        bin.abstainVotes += abstain;
    }

    for (const bin of bins) {
        const sum = bin.yesVotes + bin.noVotes + bin.abstainVotes || 1;
        bin.yesPct = (bin.yesVotes / sum) * 100;
        bin.noPct = (bin.noVotes / sum) * 100;
    }

    return { bins };
}


