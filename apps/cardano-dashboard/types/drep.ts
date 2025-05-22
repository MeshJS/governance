export interface DRepBasicData {
    drep_id: string;
    hex: string;
    has_script: boolean;
    registered: boolean;
}

export interface DRepDetailedData extends DRepBasicData {
    deposit: string;
    active: boolean;
    expires_epoch_no: number;
    amount: string;
    meta_url: string;
    meta_hash: string;
    updated_at?: string;
} 