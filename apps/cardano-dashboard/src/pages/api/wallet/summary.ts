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
    fingerprint?: string;
    minting_tx_hash?: string;
    total_supply?: string; // integer as string
    mint_cnt?: number;
    burn_cnt?: number;
    creation_time?: number;
    minting_tx_metadata?: unknown; // CIP-25/721 or other structures
    token_registry_metadata?: {
        name?: string;
        ticker?: string;
        decimals?: number;
        description?: string;
        url?: string;
        logo?: string; // base64 logo if present
    } | null;
    cip68_metadata?: unknown | null;
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
        meta?: KoiosAssetInfoItem | null; // raw metadata for client logging
        kind: 'fungible' | 'nft';
        formattedQuantity: string; // decimals-adjusted for fungible
        displayName: string; // ticker | ascii | name | unit
        imageUrl?: string | null;
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

function formatWithDecimals(quantity: bigint, decimals: number | undefined): string {
    if (!decimals || decimals <= 0) return quantity.toString();
    const q = quantity.toString();
    if (q.length <= decimals) {
        const padded = q.padStart(decimals + 1, '0');
        const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
        return frac ? `0.${frac}` : '0';
    }
    const intPart = q.slice(0, q.length - decimals);
    const fracPart = q.slice(q.length - decimals).replace(/0+$/, '');
    return fracPart ? `${intPart}.${fracPart}` : intPart;
}

function ipfsToHttp(url: string): string {
    if (typeof url === 'string' && url.startsWith('ipfs://')) {
        const path = url.slice('ipfs://'.length);
        return `https://ipfs.io/ipfs/${path}`;
    }
    return url;
}

type MetadataMap = Record<string, unknown>;

function getImageFromCandidate(candidate: unknown): string | null {
    if (!candidate || typeof candidate !== 'object') return null;
    const c = candidate as MetadataMap;
    const imgVal = c['image'];
    if (typeof imgVal === 'string') return ipfsToHttp(imgVal);
    if (Array.isArray(imgVal) && imgVal.length > 0 && typeof imgVal[0] === 'string') return ipfsToHttp(imgVal[0]);
    const filesVal = c['files'];
    if (Array.isArray(filesVal) && filesVal.length > 0) {
        const first = filesVal[0] as MetadataMap;
        const src = first['src'];
        if (typeof src === 'string') return ipfsToHttp(src);
    }
    return null;
}

function resolveImageFromMeta(m: KoiosAssetInfoItem | null | undefined): string | null {
    if (!m) return null;
    // Token registry base64 logo
    const regMeta = m.token_registry_metadata as { logo?: string } | null | undefined;
    const logo = regMeta?.logo;
    if (logo && logo.length > 0) return `data:image/png;base64,${logo}`;

    const md = m.minting_tx_metadata as Record<string, unknown> | undefined;
    try {
        if (md && typeof md === 'object') {
            // CIP-25 721 key
            const md721 = md['721'] as MetadataMap | undefined;
            const byPolicy721 = md721 && typeof md721 === 'object' ? (md721[m.policy_id] as MetadataMap | undefined) : undefined;
            if (byPolicy721 && typeof byPolicy721 === 'object') {
                const byAscii = m.asset_name_ascii ? (byPolicy721[m.asset_name_ascii] as unknown) : undefined;
                const candidate = byAscii ?? (Object.values(byPolicy721)[0] as unknown);
                const resolved = getImageFromCandidate(candidate);
                if (resolved) return resolved;
            }
            // Some projects use key '1'
            const md1 = md['1'] as MetadataMap | undefined;
            const byPolicy1 = md1 && typeof md1 === 'object' ? (md1[m.policy_id] as MetadataMap | undefined) : undefined;
            if (byPolicy1 && typeof byPolicy1 === 'object') {
                const byAscii = m.asset_name_ascii ? (byPolicy1[m.asset_name_ascii] as unknown) : undefined;
                const candidate = byAscii ?? (Object.values(byPolicy1)[0] as unknown);
                const resolved = getImageFromCandidate(candidate);
                if (resolved) return resolved;
            }
        }
    } catch { }
    return null;
}

function resolveNameFromMeta(m: KoiosAssetInfoItem | null | undefined): string | null {
    if (!m) return null;
    const md = m.minting_tx_metadata as Record<string, unknown> | undefined;
    try {
        if (md && typeof md === 'object') {
            const md721 = md['721'] as MetadataMap | undefined;
            const byPolicy721 = md721 && typeof md721 === 'object' ? (md721[m.policy_id] as MetadataMap | undefined) : undefined;
            if (byPolicy721 && typeof byPolicy721 === 'object') {
                const byAscii = m.asset_name_ascii ? (byPolicy721[m.asset_name_ascii] as unknown) : undefined;
                const candidate = byAscii ?? (Object.values(byPolicy721)[0] as unknown);
                if (candidate && typeof candidate === 'object' && typeof (candidate as MetadataMap)['name'] === 'string') {
                    return (candidate as MetadataMap)['name'] as string;
                }
            }
            const md1 = md['1'] as MetadataMap | undefined;
            const byPolicy1 = md1 && typeof md1 === 'object' ? (md1[m.policy_id] as MetadataMap | undefined) : undefined;
            if (byPolicy1 && typeof byPolicy1 === 'object') {
                const byAscii = m.asset_name_ascii ? (byPolicy1[m.asset_name_ascii] as unknown) : undefined;
                const candidate = byAscii ?? (Object.values(byPolicy1)[0] as unknown);
                if (candidate && typeof candidate === 'object' && typeof (candidate as MetadataMap)['name'] === 'string') {
                    return (candidate as MetadataMap)['name'] as string;
                }
            }
        }
    } catch { }
    return null;
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
        // Koios expects an array of [policy_id, asset_name] pairs
        const assetListPairs: Array<[string, string]> = uniqueUnits.map((unit) => [unit.slice(0, 56), unit.slice(56)]);
        const meta: KoiosAssetInfoItem[] = uniqueUnits.length
            ? await postKoios<KoiosAssetInfoItem[]>(`${base}/asset_info`, { _asset_list: assetListPairs })
            : [];
        const unitToMeta = new Map<string, KoiosAssetInfoItem>();
        for (const m of meta) {
            // Server-side log to inspect Koios asset info entries
            console.log('Koios asset meta:', m);
            unitToMeta.set(`${m.policy_id}${m.asset_name}`, m);
        }

        const resultAssets = uniqueUnits.map((unit) => {
            const { policy_id, asset_name, quantity } = aggregatedAssets.get(unit)!;
            const m = unitToMeta.get(unit);
            // Prefer Koios asset_name_ascii directly; else decode hex asset_name
            const ascii = (m?.asset_name_ascii && m.asset_name_ascii.length > 0)
                ? m.asset_name_ascii
                : (decodeHexAscii(asset_name) ?? undefined);
            const metaName = resolveNameFromMeta(m);
            const bestName = m?.token_registry_metadata?.name || metaName || ascii || undefined;
            const decimals = m?.token_registry_metadata?.decimals ?? undefined;
            const ticker = m?.token_registry_metadata?.ticker ?? undefined;
            const totalSupplyBig = m?.total_supply ? (() => { try { return BigInt(m.total_supply); } catch { return null; } })() : null;
            const isFungible: 'fungible' | 'nft' = ((typeof decimals === 'number' && decimals > 0) || (totalSupplyBig !== null && totalSupplyBig > BigInt(1))) ? 'fungible' : 'nft';
            const imageUrl = resolveImageFromMeta(m ?? null);
            const formattedQuantity = isFungible === 'fungible' ? formatWithDecimals(quantity, decimals ?? 0) : quantity.toString();
            const displayName = isFungible === 'fungible' ? (ticker || ascii || bestName || unit) : (metaName || ascii || bestName || unit);
            return {
                unit,
                policyId: policy_id,
                assetNameHex: asset_name,
                name: bestName ?? unit,
                ticker,
                decimals,
                quantity: quantity.toString(),
                meta: m ?? null,
                kind: isFungible,
                formattedQuantity,
                displayName,
                imageUrl,
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


