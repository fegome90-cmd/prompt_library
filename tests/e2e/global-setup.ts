import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

/**
 * Seed the local E2E database directly through the CLI.
 * No HTTP seed endpoint or magic request header is required.
 */
async function globalSetup() {
  console.log('[E2E Setup] Preparing local test database...');

  execFileSync('bun', ['run', 'db:push'], { stdio: 'inherit' });

  // Generated only for this local test process; never persisted in Git.
  const seedPassword = randomBytes(32).toString('base64url');
  execFileSync('bun', ['run', 'scripts/seed.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SEED_ADMIN_EMAIL: 'e2e-admin@example.invalid',
      SEED_ADMIN_PASSWORD: seedPassword,
    },
  });

  console.log('[E2E Setup] Test data initialized.');
}

export default globalSetup;
