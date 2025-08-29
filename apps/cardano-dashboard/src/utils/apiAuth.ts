import type { NextApiRequest } from 'next';
import { verifyAuthCookie } from '@/utils/authCookie';

export type AuthContext = {
    address: string | null;
};

export function getAuthContext(req: NextApiRequest): AuthContext {
    const cookie = req.cookies?.['cd_auth'];
    const auth = verifyAuthCookie(cookie);
    return { address: auth?.address ?? null };
}


