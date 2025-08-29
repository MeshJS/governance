import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthCookie } from '@/utils/authCookie';

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
    const cookie = req.cookies['cd_auth'];
    const auth = verifyAuthCookie(cookie);
    if (auth) {
        res.status(200).json({ authenticated: true, address: auth.address });
        return;
    }
    res.status(200).json({ authenticated: false });
}


