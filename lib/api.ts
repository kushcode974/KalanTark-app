export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    let token = localStorage.getItem('kalantark_token');
    if (!token) {
        const matches = document.cookie.match(/(?:^|; )kalantark_token=([^;]*)/);
        if (matches && matches[1]) {
            token = matches[1];
            localStorage.setItem('kalantark_token', token); // restore it
        }
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

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('kalantark_token');
            document.cookie = 'kalantark_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = '/login';
        }
    }

    return response;
}
