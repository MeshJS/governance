export interface Vote {
    vote: 'yes' | 'no' | 'abstain';
    proposal: string;
    type: string;
    date: string;
    epochs: number;
} 