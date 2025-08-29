import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const httpOnly = isProd ? 'HttpOnly; ' : '';
    res.setHeader('Set-Cookie', `cd_auth=deleted; Path=/; ${httpOnly}SameSite=Lax; Max-Age=0; ${isProd ? 'Secure; ' : ''}`);
    res.status(200).json({ ok: true });
}


