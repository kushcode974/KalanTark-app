import { verifyToken } from './auth';

export function getUserIdFromRequest(req: Request): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId?: string } | null;

    return decoded?.userId || null;
}
