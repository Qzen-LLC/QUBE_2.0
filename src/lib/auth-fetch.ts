/**
 * Install a global fetch interceptor that automatically refreshes
 * the access token on 401 responses from API routes.
 *
 * Call this once from a client component (e.g., AuthProvider).
 */
let installed = false;
let refreshPromise: Promise<boolean> | null = null;

// Routes that handle their own 401 logic — don't intercept these
const EXCLUDED_ROUTES = ['/api/auth/', '/api/user/me'];

export function installFetchInterceptor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const res = await originalFetch(input, init);

    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const isExcluded = EXCLUDED_ROUTES.some((r) => url.includes(r));

    if (res.status === 401 && url.includes('/api/') && !isExcluded) {
      // Coalesce multiple concurrent refresh attempts into one
      if (!refreshPromise) {
        refreshPromise = originalFetch('/api/auth/refresh', { method: 'POST' })
          .then((r) => r.ok)
          .catch(() => false)
          .finally(() => { refreshPromise = null; });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        return originalFetch(input, init);
      }
      // Refresh failed — return the original 401, let the component decide
    }

    return res;
  };
}
