import type { NextApiRequest, NextApiResponse } from 'next';
import { getPinata, resolveGatewayUrl } from '@/lib/pinata';
import formidable, { type File, type Fields, type Files } from 'formidable';
import fs from 'node:fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

type Data = { error: string } | { cid: string; gatewayUrl: string; ipfsUri: string };

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files; }> {
    return new Promise((resolve, reject) => {
        const form = formidable({ multiples: false, maxFiles: 1 });
        form.parse(req, (err: unknown, fields: Fields, files: Files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { files } = await parseForm(req);
        let file: File | undefined;
        const candidate = (files as unknown as Record<string, unknown>)?.file as unknown;
        if (Array.isArray(candidate)) {
            file = candidate[0] as File;
        } else if (candidate && typeof candidate === 'object') {
            file = candidate as File;
        } else {
            // Fallback: take the first file-like value in the map
            const first = Object.values(files as unknown as Record<string, unknown>)[0];
            if (Array.isArray(first)) file = first[0] as File;
            else if (first && typeof first === 'object') file = first as File;
        }
        if (!file) {
            return res.status(400).json({ error: 'Missing file field "file"' });
        }

        const filepath = (file as unknown as { filepath?: string; path?: string }).filepath
            || (file as unknown as { filepath?: string; path?: string }).path;
        if (!filepath) {
            return res.status(400).json({ error: 'Upload failed: no file path resolved' });
        }

        const stream = fs.createReadStream(filepath);
        const { pinata } = getPinata();
        const result = await pinata.pinFileToIPFS(stream, {
            pinataMetadata: { name: (file as unknown as { originalFilename?: string | null }).originalFilename || 'upload' },
        });

        const gatewayUrl = resolveGatewayUrl({ cid: result.IpfsHash });
        const ipfsUri = `ipfs://${result.IpfsHash}`;
        return res.status(200).json({ cid: result.IpfsHash, gatewayUrl, ipfsUri });
    } catch (error) {
        console.error('upload-to-pinata error', error);
        return res.status(500).json({ error: 'Upload failed' });
    }
}


