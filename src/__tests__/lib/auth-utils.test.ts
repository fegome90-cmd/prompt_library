/**
 * Auth Utils Tests
 * 
 * Tests for authentication utility functions
 */

import { describe, it, expect } from 'vitest';
import { 
  hasRole, 
  canModifyPrompt, 
  canDeletePrompt,
  type AuthUser 
} from '@/lib/auth-utils';

describe('hasRole', () => {
  it('should return false for null user', () => {
    expect(hasRole(null, ['owner', 'editor'])).toBe(false);
  });

  it('should return true for user with matching role', () => {
    const user: AuthUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      role: 'owner',
    };
    expect(hasRole(user, ['owner', 'editor'])).toBe(true);
  });

  it('should return false for user without matching role', () => {
    const user: AuthUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      role: 'user',
    };
    expect(hasRole(user, ['owner', 'editor'])).toBe(false);
  });

  it('should handle multiple roles', () => {
    const user: AuthUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      role: 'reviewer',
    };
    expect(hasRole(user, ['owner', 'editor', 'reviewer'])).toBe(true);
  });

  it('should return false for empty roles array', () => {
    const user: AuthUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      role: 'owner',
    };
    expect(hasRole(user, [])).toBe(false);
  });
});

describe('canModifyPrompt', () => {
  const ownerUser: AuthUser = { id: '1', email: 'owner@test.com', name: 'Owner', role: 'owner' };
  const editorUser: AuthUser = { id: '2', email: 'editor@test.com', name: 'Editor', role: 'editor' };
  const reviewerUser: AuthUser = { id: '3', email: 'reviewer@test.com', name: 'Reviewer', role: 'reviewer' };
  const regularUser: AuthUser = { id: '4', email: 'user@test.com', name: 'User', role: 'user' };

  it('owner can modify any prompt', () => {
    expect(canModifyPrompt(ownerUser, 'any-author-id')).toBe(true);
  });

  it('editor can modify any prompt', () => {
    expect(canModifyPrompt(editorUser, 'any-author-id')).toBe(true);
  });

  it('reviewer can modify any prompt', () => {
    expect(canModifyPrompt(reviewerUser, 'any-author-id')).toBe(true);
  });

  it('user can only modify own prompt', () => {
    expect(canModifyPrompt(regularUser, '4')).toBe(true);
    expect(canModifyPrompt(regularUser, 'different-author-id')).toBe(false);
  });

  it('null user cannot modify', () => {
    expect(canModifyPrompt(null, 'any-author-id')).toBe(false);
  });
});

describe('canDeletePrompt', () => {
  const ownerUser: AuthUser = { id: '1', email: 'owner@test.com', name: 'Owner', role: 'owner' };
  const editorUser: AuthUser = { id: '2', email: 'editor@test.com', name: 'Editor', role: 'editor' };
  const reviewerUser: AuthUser = { id: '3', email: 'reviewer@test.com', name: 'Reviewer', role: 'reviewer' };
  const regularUser: AuthUser = { id: '4', email: 'user@test.com', name: 'User', role: 'user' };

  it('owner can delete', () => {
    expect(canDeletePrompt(ownerUser)).toBe(true);
  });

  it('editor can delete', () => {
    expect(canDeletePrompt(editorUser)).toBe(true);
  });

  it('reviewer cannot delete', () => {
    expect(canDeletePrompt(reviewerUser)).toBe(false);
  });

  it('user cannot delete', () => {
    expect(canDeletePrompt(regularUser)).toBe(false);
  });

  it('null user cannot delete', () => {
    expect(canDeletePrompt(null)).toBe(false);
  });
});
