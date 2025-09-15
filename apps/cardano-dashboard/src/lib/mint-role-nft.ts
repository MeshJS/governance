import { Transaction, ForgeScript, resolvePaymentKeyHash, resolveSlotNo, resolveNativeScriptHash } from '@meshsdk/core';
import type { AssetMetadata, Mint, NativeScript } from '@meshsdk/core';
import type { BrowserWallet } from '@meshsdk/core';

export type MintRoleNftInput = {
    wallet: BrowserWallet;
    recipientAddress: string;
    role: 'admin' | 'editor' | 'owner';
    projectName: string;
    imageUrl?: string;
    policyType?: 'open' | 'closed';
    expiresInMinutes?: number;
};

export type MintRoleNftOutput = {
    txHash: string;
    // Hints so caller can resolve unit and display info
    policyId?: string;
    assetName?: string;
    unit?: string;
};

function normalizeImageUrl(input?: string): string | undefined {
    if (!input) return undefined;
    const s = input.trim();
    if (!s) return undefined;
    // Prefer ipfs://CID[/path]; convert common gateway forms
    const ipfsMatch = /^ipfs:\/\/(.+)$/i.exec(s);
    if (ipfsMatch) return `ipfs://${ipfsMatch[1]}`;
    const gw = /\/(ipfs)\/([A-Za-z0-9]+)(?:\/.+)?$/.exec(s);
    if (gw) return `ipfs://${gw[2]}`;
    return s;
}

function buildRoleMetadata({ role, projectName, imageUrl }: { role: 'admin' | 'editor' | 'owner'; projectName: string; imageUrl?: string; }): AssetMetadata {
    const display = `${projectName} · ${role.toUpperCase()} Role`;
    const base: Record<string, string | string[]> = {
        name: display,
        description: [`Role NFT for ${projectName}`, `role=${role}`],
    };
    const normalized = normalizeImageUrl(imageUrl);
    if (normalized) {
        base.image = normalized;
        base.mediaType = 'image/png';
    }
    return base as unknown as AssetMetadata;
}

function toHex(input: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input);
    let hex = '';
    for (let i = 0; i < bytes.length; i += 1) {
        const h = bytes[i].toString(16).padStart(2, '0');
        hex += h;
    }
    return hex;
}

export async function mintRoleNft({ wallet, recipientAddress, role, projectName, imageUrl, policyType = 'open', expiresInMinutes = 10, }: MintRoleNftInput): Promise<MintRoleNftOutput> {
    // Resolve address for forging policy
    const usedAddresses = await wallet.getUsedAddresses();
    const initiatingAddress = usedAddresses?.[0] || (await wallet.getChangeAddress());
    if (!initiatingAddress) throw new Error('Wallet has no address');

    const keyHash = resolvePaymentKeyHash(initiatingAddress);
    const now = Date.now();
    const expireAtMs = now + expiresInMinutes * 60 * 1000;
    const network = initiatingAddress.startsWith('addr_test') ? 'preprod' : 'mainnet';
    const expireSlot = resolveSlotNo(network, expireAtMs);

    let forgingScript: ReturnType<typeof ForgeScript.withOneSignature> | ReturnType<typeof ForgeScript.fromNativeScript>;
    let policyNativeScript: NativeScript;
    if (policyType === 'closed') {
        const native: NativeScript = {
            type: 'all',
            scripts: [
                { type: 'before', slot: expireSlot },
                { type: 'sig', keyHash },
            ],
        };
        forgingScript = ForgeScript.fromNativeScript(native);
        policyNativeScript = native;
    } else {
        forgingScript = ForgeScript.withOneSignature(initiatingAddress);
        policyNativeScript = { type: 'sig', keyHash };
    }

    const tx = new Transaction({ initiator: wallet });

    const assetName = `${projectName.replace(/\s+/g, '')}.${role}`;
    const assetMd = buildRoleMetadata({ role, projectName, imageUrl });
    const policyId = resolveNativeScriptHash(policyNativeScript);
    const assetNameHex = toHex(assetName);
    const unit = `${policyId}${assetNameHex}`;

    // Log mint metadata and parameters for troubleshooting
    try {
        // Keep logs concise and non-sensitive
        console.log('[mintRoleNft] metadata', { assetName, role, projectName, hasImage: !!imageUrl, policyType });
        console.log('[mintRoleNft] assetMetadata', assetMd);
        console.log('[mintRoleNft] policyAndAsset', { policyId, assetName });
        console.log('[mintRoleNft] unit', unit);
    } catch { }

    const mint: Mint = {
        assetName,
        assetQuantity: '1',
        metadata: assetMd,
        label: '721',
        recipient: recipientAddress,
    };

    tx.mintAsset(forgingScript, mint);
    // If using a time-locked policy add TTL for safer UX
    if (policyType === 'closed') {
        tx.setTimeToExpire(expireSlot);
    }

    const unsigned = await tx.build();
    const signed = await wallet.signTx(unsigned);
    const txHash = await wallet.submitTx(signed);

    return { txHash, assetName, policyId, unit };
}


