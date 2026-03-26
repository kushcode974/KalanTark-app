/**
 * getToken — reads auth token from localStorage, falls back to cookie.
 * If found in cookie but not localStorage, it restores it to localStorage.
 * This ensures session survives aggressive mobile app-kill / webview hibernation.
 */
export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem('kalantark_token');
    console.log('getToken — localStorage value:', token ? 'EXISTS' : 'NULL');
    if (!token) {
        const matches = document.cookie.match(/(?:^|; )kalantark_token=([^;]*)/);
        if (matches && matches[1]) {
            token = matches[1];
            localStorage.setItem('kalantark_token', token); // restore from cookie
        }
        console.log('getToken — cookie fallback value:', token ? 'FOUND IN COOKIE' : 'NOT IN COOKIE EITHER');
    }
    return token;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = getToken();

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            return response;
        }

        return response;
    } catch (error) {
        throw error;
    }
}
