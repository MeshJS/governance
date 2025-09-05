import { Transaction, ForgeScript, resolvePaymentKeyHash, resolveSlotNo } from '@meshsdk/core';
import type { AssetMetadata, Mint, NativeScript } from '@meshsdk/core';
import type { BrowserWallet } from '@meshsdk/core';

export type MintRoleNftInput = {
    wallet: BrowserWallet;
    recipientAddress: string;
    role: 'admin' | 'editor';
    projectName: string;
    imageUrl?: string;
    policyType?: 'open' | 'closed';
    expiresInMinutes?: number;
};

export type MintRoleNftOutput = {
    txHash: string;
    // Best-effort hints so caller can later resolve fingerprint via wallet refresh or indexer
    policyId?: string;
    assetName?: string;
};

function buildRoleMetadata({ role, projectName, imageUrl }: { role: 'admin' | 'editor'; projectName: string; imageUrl?: string; }): AssetMetadata {
    const display = `${projectName} · ${role.toUpperCase()} Role`;
    const base: Record<string, string | string[]> = {
        name: display,
        description: [`Role NFT for ${projectName}`, `role=${role}`],
    };
    if (imageUrl && imageUrl.trim().length > 0) {
        base.image = imageUrl.trim();
        base.mediaType = 'image/png';
    }
    return base as unknown as AssetMetadata;
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
    if (policyType === 'closed') {
        const native: NativeScript = {
            type: 'all',
            scripts: [
                { type: 'before', slot: expireSlot },
                { type: 'sig', keyHash },
            ],
        };
        forgingScript = ForgeScript.fromNativeScript(native);
    } else {
        forgingScript = ForgeScript.withOneSignature(initiatingAddress);
    }

    const tx = new Transaction({ initiator: wallet });

    const assetName = `${projectName.replace(/\s+/g, '')}.${role}`;
    const assetMd = buildRoleMetadata({ role, projectName, imageUrl });

    // Log mint metadata and parameters for troubleshooting
    try {
        // Keep logs concise and non-sensitive
        console.log('[mintRoleNft] metadata', { assetName, role, projectName, hasImage: !!imageUrl, policyType });
        console.log('[mintRoleNft] assetMetadata', assetMd);
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

    return { txHash, assetName };
}


