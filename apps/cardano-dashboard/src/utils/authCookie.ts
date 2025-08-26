import crypto from 'crypto';

export interface AuthPayload {
    address: string;
    ts: number;
}

export function signAuthPayload(payload: AuthPayload): string {
    const secret = process.env.AUTH_SECRET as string;
    const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
    return `${b64}.${sig}`;
}

export function verifyAuthCookie(cookieValue: string | undefined): AuthPayload | null {
    try {
        const secret = process.env.AUTH_SECRET as string;
        if (!cookieValue) return null;
        const [b64, sig] = cookieValue.split('.');
        if (!b64 || !sig) return null;
        if (secret) {
            const expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
            if (expected !== sig) return null;
        }
        const json = Buffer.from(b64, 'base64url').toString('utf8');
        const parsed = JSON.parse(json) as AuthPayload;
        return parsed;
    } catch {
        return null;
    }
}


