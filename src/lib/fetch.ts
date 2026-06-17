export async function jsonFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error?.error ?? res.statusText);
    }
    return res.json() as Promise<T>;
}
