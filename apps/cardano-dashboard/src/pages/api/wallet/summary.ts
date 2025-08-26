import type { NextApiRequest, NextApiResponse } from 'next';

type KoiosAddressInfo = Array<{
    address: string;
    balance?: string; // lovelace
    stake_address?: string | null;
}>;

type KoiosAddressAssetsItem = {
    policy_id: string;
    asset_name: string; // hex
    quantity: string;
};

type KoiosAddressAssets =
    | Array<{ address?: string; asset_list?: KoiosAddressAssetsItem[] }>
    | KoiosAddressAssetsItem[];

type KoiosAccountUtxo = {
    tx_hash?: string;
    tx_index?: number;
    value?: string; // lovelace
    asset_list?: KoiosAddressAssetsItem[];
};

type KoiosAccountAssets = Array<{
    stake_address: string;
    policy_id: string;
    asset_name: string; // hex
    fingerprint?: string;
    decimals?: number;
    quantity: string;
}>;

type KoiosAssetInfoItem = {
    policy_id: string;
    asset_name: string; // hex
    asset_name_ascii?: string | null;
    token_registry_metadata?: {
        name?: string;
        ticker?: string;
        decimals?: number;
        description?: string;
        url?: string;
    } | null;
};

type WalletSummaryResponse = {
    address: string;
    network: 'mainnet' | 'preprod';
    lovelace: string;
    ada: string; // decimal string
    assets: Array<{
        unit: string; // policyId + assetNameHex
        policyId: string;
        assetNameHex: string;
        name: string; // best-effort readable
        ticker?: string;
        decimals?: number;
        quantity: string;
    }>;
};

function getKoiosBase(address: string): string {
    const isTest = address.startsWith('addr_test') || address.startsWith('stake_test');
    return isTest ? 'https://preprod.koios.rest/api/v1' : 'https://api.koios.rest/api/v1';
}

function isStakeAddress(value: string): boolean {
    return value.startsWith('stake') || value.startsWith('stake_test');
}

function decodeHexAscii(hex: string | null | undefined): string | null {
    if (!hex) return null;
    const clean = hex.trim();
    if (!clean || /[^0-9a-fA-F]/.test(clean) || clean.length % 2 !== 0) return null;
    try {
        const bytes = new Uint8Array(clean.length / 2);
        for (let i = 0; i < clean.length; i += 2) {
            bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
        }
        const decoded = new TextDecoder().decode(bytes);
        const isPrintable = decoded.length > 0 && [...decoded].every((ch) => {
            const code = ch.charCodeAt(0);
            return code >= 32 && code <= 126;
        });
        return isPrintable ? decoded : null;
    } catch {
        return null;
    }
}

async function postKoios<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Koios error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<WalletSummaryResponse | { error: string }>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { address, stakeAddress } = req.body as { address?: string; stakeAddress?: string };
    const input = (stakeAddress || address || '').trim();
    if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'address or stakeAddress is required' });
    }

    const base = getKoiosBase(input);

    try {
        const aggregatedAssets: Map<string, { policy_id: string; asset_name: string; quantity: bigint }> = new Map();
        let lovelace = '0';
        const useStake = isStakeAddress(input);

        // Resolve stake address when payment address is passed
        let stake = useStake ? input : undefined;
        if (!stake) {
            const info = await postKoios<KoiosAddressInfo>(`${base}/address_info`, { _addresses: [input] });
            stake = info?.[0]?.stake_address ?? undefined;
        }

        if (stake) {
            // Aggregate from stake account APIs
            const utxos = await postKoios<KoiosAccountUtxo[]>(`${base}/account_utxos`, { _stake_addresses: [stake] });
            let total = BigInt(0);
            for (const u of utxos ?? []) {
                if (u?.value) {
                    try { total += BigInt(u.value); } catch { }
                }
            }
            lovelace = total.toString();

            const accountAssets = await postKoios<KoiosAccountAssets>(`${base}/account_assets`, { _stake_addresses: [stake] });
            for (const a of accountAssets ?? []) {
                const key = `${a.policy_id}${a.asset_name}`;
                const prev = aggregatedAssets.get(key)?.quantity ?? BigInt(0);
                let q = BigInt(0); try { q = BigInt(a.quantity); } catch { q = BigInt(0); }
                aggregatedAssets.set(key, { policy_id: a.policy_id, asset_name: a.asset_name, quantity: prev + q });
            }
        } else {
            // Fallback to payment address path if no stake address is resolvable
            const info = await postKoios<KoiosAddressInfo>(`${base}/address_info`, { _addresses: [input] });
            lovelace = info?.[0]?.balance ?? '0';

            const assetsResp = await postKoios<KoiosAddressAssets>(`${base}/address_assets`, { _addresses: [input] });
            let addrAssets: KoiosAddressAssetsItem[] = [];
            if (Array.isArray(assetsResp)) {
                if ('policy_id' in (assetsResp[0] ?? {})) {
                    addrAssets = assetsResp as KoiosAddressAssetsItem[];
                } else {
                    const first = assetsResp[0] as { asset_list?: KoiosAddressAssetsItem[] } | undefined;
                    addrAssets = first?.asset_list ?? [];
                }
            }
            for (const a of addrAssets) {
                const key = `${a.policy_id}${a.asset_name}`;
                const prev = aggregatedAssets.get(key)?.quantity ?? BigInt(0);
                let q = BigInt(0); try { q = BigInt(a.quantity); } catch { q = BigInt(0); }
                aggregatedAssets.set(key, { policy_id: a.policy_id, asset_name: a.asset_name, quantity: prev + q });
            }
        }

        // Metadata lookups
        const uniqueUnits = Array.from(aggregatedAssets.keys());
        const meta: KoiosAssetInfoItem[] = uniqueUnits.length
            ? await postKoios<KoiosAssetInfoItem[]>(`${base}/asset_info`, { _asset_list: uniqueUnits })
            : [];
        const unitToMeta = new Map<string, KoiosAssetInfoItem>();
        for (const m of meta) unitToMeta.set(`${m.policy_id}${m.asset_name}`, m);

        const resultAssets = uniqueUnits.map((unit) => {
            const { policy_id, asset_name, quantity } = aggregatedAssets.get(unit)!;
            const m = unitToMeta.get(unit);
            const ascii = decodeHexAscii(m?.asset_name_ascii ?? asset_name) ?? undefined;
            const name = m?.token_registry_metadata?.ticker
                || m?.token_registry_metadata?.name
                || ascii
                || unit;
            const decimals = m?.token_registry_metadata?.decimals ?? undefined;
            const ticker = m?.token_registry_metadata?.ticker ?? undefined;
            return {
                unit,
                policyId: policy_id,
                assetNameHex: asset_name,
                name,
                ticker,
                decimals,
                quantity: quantity.toString(),
            };
        });

        const ada = (Number(lovelace) / 1_000_000).toFixed(6);
        const payload: WalletSummaryResponse = {
            address: input,
            network: base.includes('preprod') ? 'preprod' : 'mainnet',
            lovelace,
            ada,
            assets: resultAssets,
        };
        return res.status(200).json(payload);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to query Koios';
        return res.status(500).json({ error: message });
    }
}


