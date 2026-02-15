/**
 * WO-0012: Test básico de setup
 */
import { describe, it, expect } from 'vitest';

describe('Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have environment configured', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
