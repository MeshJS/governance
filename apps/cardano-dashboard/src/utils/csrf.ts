import type { NextApiRequest, NextApiResponse } from 'next';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function requireCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
    const method = req.method || 'GET';
    if (!MUTATING_METHODS.has(method)) return true;
    const header = (req.headers['x-csrf-token'] ?? req.headers['x-csrf']) as string | string[] | undefined;
    const token = Array.isArray(header) ? header[0] : header;
    const cookie = req.cookies?.['cd_csrf'];
    if (!token || !cookie || token !== cookie) {
        res.status(403).json({ error: 'CSRF token invalid' });
        return false;
    }
    return true;
}

export function getClientCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|; )cd_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}


