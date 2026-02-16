import { execSync } from 'child_process';
import { request } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Ensures database is seeded before tests run
 */
async function globalSetup() {
  console.log('[E2E Setup] Starting global setup...');

  // 1. Sync database schema (ensure migrations are applied)
  try {
    console.log('[E2E Setup] Syncing database schema...');
    execSync('bun run db:push', { stdio: 'inherit' });
  } catch (error) {
    console.error('[E2E Setup] Failed to sync database schema:', error);
    throw error;
  }

  // 2. Seed database via API
  console.log('[E2E Setup] Seeding database...');
  const context = await request.newContext();

  try {
    const response = await context.get('http://localhost:3000/api/seed', {
      headers: { 'x-e2e-test': 'true' },
      timeout: 30000,
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      const statusCode = response.status();
      console.error('[E2E Setup] Seed failed:', statusCode, errorBody);
      throw new Error(`Seed failed with status ${statusCode}: ${errorBody}`);
    }

    const result = await response.json();
    console.log('[E2E Setup] Seed completed:', result);
  } catch (error) {
    console.error('[E2E Setup] Error calling seed endpoint:', error);
    throw error;
  } finally {
    await context.dispose();
  }

  console.log('[E2E Setup] Global setup completed successfully');
}

export default globalSetup;
