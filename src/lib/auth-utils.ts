/**
 * Authentication Utilities
 *
 * Server-side utilities for getting the current session and user.
 * Use these in API routes and Server Components.
 *
 * SECURITY: The dev fallback requires explicit DEV_AUTH_BYPASS=true env var.
 * It will NEVER work in production (NODE_ENV === 'production' blocks it).
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { db } from './db';
import { logger } from './logger';

/**
 * User type returned by authentication functions
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
}

/**
 * Result of authentication check
 */
export interface AuthResult {
  success: boolean;
  user: AuthUser | null;
  error?: string;
}

/**
 * Get the current session from NextAuth
 *
 * @returns The session object or null if not authenticated
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 *
 * @returns The user object or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    image: session.user.image,
  };
}

/**
 * Require authentication - throws error if not authenticated
 *
 * @returns The authenticated user
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Check if user has required role
 *
 * @param user - The user to check
 * @param roles - Array of allowed roles
 * @returns true if user has one of the required roles
 */
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user can modify prompts
 *
 * Rules:
 * - owner: can modify all prompts
 * - editor: can modify all prompts
 * - reviewer: can modify prompts assigned to them
 * - user: can only modify their own prompts
 *
 * @param user - The user to check
 * @param promptAuthorId - The author ID of the prompt
 * @returns true if user can modify
 */
export function canModifyPrompt(
  user: AuthUser | null,
  promptAuthorId: string
): boolean {
  if (!user) return false;

  // Owner and editor have full access
  if (user.role === 'owner' || user.role === 'editor') {
    return true;
  }

  // Reviewer can modify (in real app, would check assignment)
  // For now, reviewers can modify any prompt
  if (user.role === 'reviewer') {
    return true;
  }

  // User can only modify their own prompts
  return user.id === promptAuthorId;
}

/**
 * Check if user can delete prompts
 *
 * Rules:
 * - owner: can delete all prompts
 * - editor: can delete all prompts
 * - reviewer: cannot delete
 * - user: cannot delete
 *
 * @param user - The user to check
 * @returns true if user can delete
 */
export function canDeletePrompt(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'owner' || user.role === 'editor';
}

/**
 * Development-only: Get default user for development
 *
 * SECURITY REQUIREMENTS:
 * 1. NODE_ENV must NOT be 'production'
 * 2. DEV_AUTH_BYPASS env var must be explicitly set to 'true'
 *
 * This double-gate ensures the bypass can never accidentally work in production.
 *
 * @returns The first user in the database or null
 */
export async function getDevUser(): Promise<AuthUser | null> {
  // SECURITY: Never allow in production
  if (process.env.NODE_ENV === 'production') {
    logger.error('[SECURITY] getDevUser called in production! This should never happen.');
    return null;
  }

  // SECURITY: Require explicit opt-in via env var
  if (process.env.DEV_AUTH_BYPASS !== 'true') {
    return null;
  }

  logger.warn(
    '[SECURITY WARNING] DEV_AUTH_BYPASS is active. ' +
    'This should ONLY be used for local development. ' +
    'Set DEV_AUTH_BYPASS=false in production!'
  );

  const user = await db.user.findFirst({
    select: { id: true, email: true, name: true, role: true, image: true },
  });

  return user;
}

/**
 * Get current user with fallback to dev user in development
 *
 * SECURITY: The fallback only works when:
 * 1. NODE_ENV !== 'production' AND
 * 2. DEV_AUTH_BYPASS === 'true' (explicit opt-in)
 *
 * This ensures the bypass can never accidentally work in production,
 * even if someone misconfigures NODE_ENV.
 *
 * @returns The authenticated user or dev user in development (with explicit opt-in)
 */
export async function getUserWithDevFallback(): Promise<AuthUser | null> {
  // Try to get real authenticated user first
  const user = await getCurrentUser();

  if (user) {
    return user;
  }

  // In development with explicit bypass, fall back to first user
  // SECURITY: getDevUser has its own gates (NODE_ENV + DEV_AUTH_BYPASS)
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true') {
    return getDevUser();
  }

  return null;
}
