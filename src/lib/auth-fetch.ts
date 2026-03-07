/**
 * Install a global fetch interceptor.
 *
 * With 24h access tokens and no refresh tokens, this is now a no-op stub
 * kept for backwards compatibility with code that calls installFetchInterceptor().
 */
let installed = false;

export function installFetchInterceptor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  // No-op — refresh tokens removed. 401s propagate naturally.
}
