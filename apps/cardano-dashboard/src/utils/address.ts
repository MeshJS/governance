// Utility helpers for Cardano addresses

export function isStakeAddress(value: string | null | undefined): boolean {
    if (!value) return false;
    return value.startsWith('stake') || value.startsWith('stake_test');
}

export function getKoiosBase(addressOrStake: string): string {
    const isTest = addressOrStake.startsWith('addr_test') || addressOrStake.startsWith('stake_test');
    return isTest ? 'https://preprod.koios.rest/api/v1' : 'https://api.koios.rest/api/v1';
}

type KoiosAddressInfo = Array<{
    address: string;
    stake_address?: string | null;
}>;

export async function resolveStakeAddress(addressOrStake: string): Promise<string | null> {
    const input = (addressOrStake || '').trim();
    if (!input) return null;
    if (isStakeAddress(input)) return input;

    try {
        const base = getKoiosBase(input);
        const res = await fetch(`${base}/address_info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ _addresses: [input] }),
        });
        if (!res.ok) return null;
        const info = (await res.json()) as KoiosAddressInfo;
        const stake = info?.[0]?.stake_address ?? null;
        return stake ?? null;
    } catch {
        return null;
    }
}

// Attempt to resolve the first payment address for a given stake address using Koios
export async function resolveFirstPaymentAddress(stakeOrPayment: string): Promise<string | null> {
    const input = (stakeOrPayment || '').trim();
    if (!input) return null;
    if (!isStakeAddress(input)) return input; // already a payment address

    try {
        const base = getKoiosBase(input);
        const res = await fetch(`${base}/account_addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ _stake_addresses: [input] }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        // Koios commonly returns: [{ stake_address: string, addresses: string[] }]
        if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            if (first && typeof first === 'object') {
                const maybeList = (first as { addresses?: unknown }).addresses;
                if (Array.isArray(maybeList) && maybeList.length > 0 && typeof maybeList[0] === 'string') {
                    return maybeList[0] as string;
                }
                const maybeAddress = (first as { address?: unknown; payment_address?: unknown }).address
                    || (first as { address?: unknown; payment_address?: unknown }).payment_address;
                if (typeof maybeAddress === 'string') return maybeAddress;
            } else if (typeof first === 'string') {
                return first;
            }
        }
        return null;
    } catch {
        return null;
    }
}


export function formatAddressShort(address: string | null | undefined, prefix = 8, suffix = 4): string {
    const v = (address || '').trim();
    if (!v) return '';
    if (v.length <= prefix + suffix + 3) return v;
    return `${v.slice(0, prefix)}...${v.slice(-suffix)}`;
}


