/**
 * API Utils Tests
 * 
 * WO-0007: Tests para createErrorResponse con errorId
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createErrorResponse } from '@/lib/api-utils';

describe('API Utils - createErrorResponse', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('should create error response with unique errorId', async () => {
    const error = new Error('Test error');
    const response = createErrorResponse(error, 'Test message');
    
    const json = await response.json();
    
    expect(json.error).toBe('Test message');
    expect(json.errorId).toBeDefined();
    expect(json.errorId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
  });

  it('should log error with errorId', () => {
    const error = new Error('Test error');
    createErrorResponse(error, 'Test message');
    
    expect(console.error).toHaveBeenCalled();
    const logCall = (console.error as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(logCall[0]).toContain('[ErrorId:');
    expect(logCall[0]).toContain('Test message');
  });

  it('should include stack trace in development', async () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Test error');
    const response = createErrorResponse(error, 'Test message');
    
    const json = await response.json();
    
    expect(json.stack).toBeDefined();
    expect(json.details).toBe('Test error');
  });

  it('should NOT include stack trace in production', async () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Test error');
    const response = createErrorResponse(error, 'Test message');
    
    const json = await response.json();
    
    expect(json.stack).toBeUndefined();
    expect(json.details).toBeUndefined();
  });

  it('should return correct status code (default 500)', async () => {
    const error = new Error('Test error');
    const response = createErrorResponse(error, 'Test message');
    
    expect(response.status).toBe(500);
  });

  it('should return custom status code when provided', async () => {
    const error = new Error('Test error');
    const response = createErrorResponse(error, 'Test message', 400);
    
    expect(response.status).toBe(400);
  });

  it('should generate different errorIds for different errors', async () => {
    const error1 = new Error('Test error 1');
    const error2 = new Error('Test error 2');
    
    const response1 = createErrorResponse(error1, 'Test message 1');
    const response2 = createErrorResponse(error2, 'Test message 2');
    
    const json1 = await response1.json();
    const json2 = await response2.json();
    
    expect(json1.errorId).not.toBe(json2.errorId);
  });

  it('should handle non-Error objects', async () => {
    const error = 'String error';
    const response = createErrorResponse(error, 'Test message');
    
    const json = await response.json();
    
    expect(json.error).toBe('Test message');
    expect(json.errorId).toBeDefined();
  });
});
