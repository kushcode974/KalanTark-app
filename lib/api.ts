/**
 * getToken — reads auth token from localStorage, falls back to cookie.
 * If found in cookie but not localStorage, it restores it to localStorage.
 * This ensures session survives aggressive mobile app-kill / webview hibernation.
 */
export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem('kalantark_token');
    if (!token) {
        const matches = document.cookie.match(/(?:^|; )kalantark_token=([^;]*)/);
        if (matches && matches[1]) {
            token = matches[1];
            localStorage.setItem('kalantark_token', token); // restore from cookie
        }
    }
    return token;
}

let isHandling401 = false;

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const executeFetch = async () => {
        const token = getToken();
        const headers = new Headers(options.headers || {});
        headers.set('Content-Type', 'application/json');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return await fetch(url, { ...options, headers });
    };

    try {
        let response = await executeFetch();

        if (response.status === 401) {
            // Using 300ms delay as noted in your recent prompts & the conflict snippet
            await new Promise(resolve => setTimeout(resolve, 300));
            response = await executeFetch();

            if (response.status === 401 && !isHandling401) {
                isHandling401 = true;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('kalantark_token');
                    document.cookie = 'kalantark_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                    window.location.href = '/login';
                }
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
}
