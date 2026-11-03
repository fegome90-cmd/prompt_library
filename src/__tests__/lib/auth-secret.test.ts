import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('NextAuth secret handling', () => {
  it('does not use a predictable fallback when production secret is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_SECRET', undefined);
    vi.resetModules();

    const { authOptions } = await import('@/lib/auth');
    expect(authOptions.secret).toBeUndefined();
  });

  it('uses the deployment-provided secret without substituting a fixed value', async () => {
    const secret = 'a-testing-only-unique-string-with-more-than-32-characters';
    vi.stubEnv('NEXTAUTH_SECRET', secret);
    vi.resetModules();

    const { authOptions } = await import('@/lib/auth');
    expect(authOptions.secret).toBe(secret);
  });
});
