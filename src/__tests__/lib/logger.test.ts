/**
 * Logger Tests
 * 
 * Tests for structured logging functionality
 */

import { describe, it, expect } from 'vitest';
import { logger, logApiError, logOperation } from '@/lib/logger';

describe('logger', () => {
  it('should not throw when logging debug messages', () => {
    expect(() => logger.debug('Debug message')).not.toThrow();
  });

  it('should not throw when logging info messages', () => {
    expect(() => logger.info('Info message')).not.toThrow();
  });

  it('should not throw when logging warn messages', () => {
    expect(() => logger.warn('Warn message')).not.toThrow();
  });

  it('should not throw when logging error messages', () => {
    expect(() => logger.error('Error message')).not.toThrow();
  });

  it('should accept context parameter', () => {
    expect(() => logger.info('Test message', { userId: '123' })).not.toThrow();
  });
});

describe('logApiError', () => {
  it('should not throw with Error object', () => {
    expect(() => logApiError('/api/test', new Error('Test error'))).not.toThrow();
  });

  it('should not throw with string error', () => {
    expect(() => logApiError('/api/test', 'String error')).not.toThrow();
  });

  it('should accept additional context', () => {
    expect(() => logApiError('/api/test', new Error('Error'), { userId: '123' })).not.toThrow();
  });
});

describe('logOperation', () => {
  it('should not throw when logging operations', () => {
    expect(() => logOperation('CREATE_PROMPT', { promptId: '123' })).not.toThrow();
  });

  it('should accept operation details', () => {
    expect(() => logOperation('UPDATE_PROMPT', { promptId: '123', changes: ['title'] })).not.toThrow();
  });
});
