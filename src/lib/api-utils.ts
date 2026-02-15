/**
 * API Utilities
 * 
 * WO-0007: Consistent error handling with errorId for debugging
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Error response with unique errorId for debugging
 */
export interface ApiErrorResponse {
  error: string;
  errorId: string;
  details?: string;
  stack?: string;
}

/**
 * Create a standardized error response with unique errorId
 * 
 * Features:
 * - Generates unique errorId for correlation with logs
 * - Logs error with errorId for debugging
 * - Includes stack trace in development mode
 * 
 * @param error - The error that occurred
 * @param message - User-friendly error message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error details
 */
export function createErrorResponse(
  error: unknown,
  message: string,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  const errorId = randomUUID();
  const isDev = process.env.NODE_ENV === 'development';
  
  // Log error with errorId for correlation
  logger.error(`[ErrorId: ${errorId}] ${message}`, { error: error instanceof Error ? error.message : String(error) });
  
  // Build response
  const response: ApiErrorResponse = {
    error: message,
    errorId,
  };
  
  // Include error details in development
  if (isDev && error instanceof Error) {
    response.details = error.message;
    response.stack = error.stack;
  }
  
  return NextResponse.json(response, { status });
}

/**
 * Helper function to wrap API handlers with consistent error handling
 * 
 * @param handler - The async handler function
 * @param handlerName - Name for logging purposes
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>,
  handlerName: string
): Promise<T | NextResponse<ApiErrorResponse>> {
  return handler().catch((error) => {
    return createErrorResponse(error, `Error in ${handlerName}`);
  });
}
