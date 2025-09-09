import pinataSDK from '@pinata/sdk';

type PinataClientLike = {
    pinFileToIPFS: (stream: unknown, options?: unknown) => Promise<{ IpfsHash: string }>;
};

type GetPinataOutput = { pinata: PinataClientLike };

export function getPinata(): GetPinataOutput {
    const jwt = process.env.PINATA_JWT;
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_API_SECRET;

    if (!jwt && (!apiKey || !apiSecret)) {
        throw new Error('Missing Pinata credentials. Set PINATA_JWT or PINATA_API_KEY/PINATA_API_SECRET');
    }

    const pinata = jwt
        ? new (pinataSDK as unknown as { new(config: { pinataJWTKey: string }): PinataClientLike })({ pinataJWTKey: jwt })
        : new (pinataSDK as unknown as { new(config: { pinataApiKey: string; pinataSecretApiKey: string }): PinataClientLike })({ pinataApiKey: apiKey as string, pinataSecretApiKey: apiSecret as string });

    return { pinata };
}

export function resolveGatewayUrl({ cid, path }: { cid: string; path?: string; }): string {
    const base = process.env.PINATA_GATEWAY_BASE?.replace(/\/$/, '') || 'https://gateway.pinata.cloud/ipfs';
    const suffix = path ? `/${path.replace(/^\//, '')}` : '';
    return `${base}/${cid}${suffix}`;
}


