export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kalantark_token') : null;

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('kalantark_token');
            window.location.href = '/login';
        }
    }

    return response;
}
