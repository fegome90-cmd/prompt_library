/**
 * Rate Limit Tests
 * 
 * Tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  checkRateLimit, 
  getClientIdentifier, 
  RATE_LIMIT_PRESETS,
  createRateLimitResponse,
  type RateLimitConfig 
} from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };

  beforeEach(() => {
    // Reset rate limit state by using unique identifiers
  });

  it('should allow first request', () => {
    const result = checkRateLimit('test-user-1', config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should track request count', () => {
    const id = 'test-user-track';
    checkRateLimit(id, config);
    checkRateLimit(id, config);
    const result = checkRateLimit(id, config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('should block when limit exceeded', () => {
    const id = 'test-user-block';
    // Make 5 requests (limit)
    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, config);
    }
    // 6th request should be blocked
    const result = checkRateLimit(id, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeDefined();
  });

  it('should handle different identifiers separately', () => {
    const result1 = checkRateLimit('user-a', config);
    const result2 = checkRateLimit('user-b', config);
    expect(result1.remaining).toBe(4);
    expect(result2.remaining).toBe(4);
  });

  it('should calculate retryAfter correctly', () => {
    const id = 'test-user-retry';
    for (let i = 0; i < 5; i++) {
      checkRateLimit(id, config);
    }
    const result = checkRateLimit(id, config);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});

describe('getClientIdentifier', () => {
  it('should parse x-forwarded-for header', () => {
    const request = new Request('http://test.com', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('should use x-real-ip header', () => {
    const request = new Request('http://test.com', {
      headers: { 'x-real-ip': '10.0.0.50' },
    });
    expect(getClientIdentifier(request)).toBe('10.0.0.50');
  });

  it('should fallback to default', () => {
    const request = new Request('http://test.com');
    expect(getClientIdentifier(request)).toBe('default-client');
  });

  it('should take first IP from chain when both headers present', () => {
    const request = new Request('http://test.com', {
      headers: { 
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        'x-real-ip': '10.0.0.50',
      },
    });
    // x-forwarded-for takes precedence
    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });
});

describe('RATE_LIMIT_PRESETS', () => {
  it('should have strict preset', () => {
    expect(RATE_LIMIT_PRESETS.strict).toEqual({ maxRequests: 10, windowMs: 60000 });
  });

  it('should have standard preset', () => {
    expect(RATE_LIMIT_PRESETS.standard).toEqual({ maxRequests: 30, windowMs: 60000 });
  });

  it('should have relaxed preset', () => {
    expect(RATE_LIMIT_PRESETS.relaxed).toEqual({ maxRequests: 100, windowMs: 60000 });
  });
});

describe('createRateLimitResponse', () => {
  it('should return 429 status', () => {
    const result = {
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    };
    const response = createRateLimitResponse(result);
    expect(response.status).toBe(429);
  });

  it('should include rate limit headers', () => {
    const result = {
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    };
    const response = createRateLimitResponse(result);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Reset')).toBe(String(Math.ceil(result.resetTime / 1000)));
  });

  it('should include retryAfter in body', async () => {
    const result = {
      success: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    };
    const response = createRateLimitResponse(result);
    const json = await response.json();
    expect(json.retryAfter).toBe(60);
    expect(json.error).toBe('Too many requests');
  });
});
