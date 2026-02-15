/**
 * RateLimitService - Simplified rate limiting for API routes
 *
 * Provides a single function to apply rate limiting, eliminating
 * duplicate rate limit setup code across API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
} from '@/lib/rate-limit';

export type RateLimitLevel = 'strict' | 'standard' | 'relaxed';

/**
 * Aplica rate limiting a una request
 *
 * @param request - The Next.js request object
 * @param level - Rate limit level: 'strict' (10/min), 'standard' (30/min), 'relaxed' (100/min)
 * @returns null si pasa el rate limit, NextResponse con error 429 si excede
 *
 * @example
 * ```typescript
 * const rateLimitError = applyRateLimit(request, 'standard');
 * if (rateLimitError) return rateLimitError;
 * ```
 */
export function applyRateLimit(
  request: NextRequest,
  level: RateLimitLevel = 'standard'
): NextResponse | null {
  const clientId = getClientIdentifier(request);
  const preset = RATE_LIMIT_PRESETS[level];
  const result = checkRateLimit(clientId, preset);

  if (!result.success) {
    return createRateLimitResponse(result) as NextResponse;
  }
  return null;
}

/**
 * Obtiene la configuración de rate limit para un nivel dado
 * Útil para logging o debugging
 */
export function getRateLimitConfig(level: RateLimitLevel): RateLimitConfig {
  return RATE_LIMIT_PRESETS[level];
}
