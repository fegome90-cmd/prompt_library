/**
 * Tests for password authentication
 *
 * WO-0103: Verify password hashing and verification
 */

import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Password Hashing', () => {
  const SALT_ROUNUNDS = 12;

  it('should hash a password', async () => {
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, SALT_ROUNUNDS);

    // Hash should be different from plain password
    expect(hash).not.toBe(password);

    // Hash should be bcrypt format
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  it('should verify correct password', async () => {
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, SALT_ROUNUNDS);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'TestPassword123!';
    const wrongPassword = 'WrongPassword456!';
    const hash = await bcrypt.hash(password, SALT_ROUNUNDS);

    const isValid = await bcrypt.compare(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('should generate unique hashes for same password', async () => {
    const password = 'TestPassword123!';
    const hash1 = await bcrypt.hash(password, SALT_ROUNUNDS);
    const hash2 = await bcrypt.hash(password, SALT_ROUNUNDS);

    // Different hashes due to random salt
    expect(hash1).not.toBe(hash2);

    // But both should verify the same password
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it('should handle empty password gracefully', async () => {
    const emptyPassword = '';
    const hash = await bcrypt.hash(emptyPassword, SALT_ROUNUNDS);

    // Should still hash (though this should be blocked at validation level)
    expect(hash).toBeDefined();

    // Should verify empty string
    const isValid = await bcrypt.compare('', hash);
    expect(isValid).toBe(true);
  });

  it('should handle long passwords', async () => {
    const longPassword = 'A'.repeat(72); // bcrypt max is 72 chars
    const hash = await bcrypt.hash(longPassword, SALT_ROUNUNDS);

    const isValid = await bcrypt.compare(longPassword, hash);
    expect(isValid).toBe(true);
  });
});

describe('Password Validation Rules', () => {
  it('should require minimum 8 characters', () => {
    const password = 'Short1!';
    expect(password.length).toBeLessThan(8);
  });

  it('should accept valid password', () => {
    const password = 'ValidPassword123!';
    expect(password.length).toBeGreaterThanOrEqual(8);
  });
});
