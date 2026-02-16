import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Health check endpoint
 * Used by E2E tests and monitoring to verify database connectivity
 */
export async function GET() {
  try {
    // Simple database connectivity check
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      database: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Health] Database check failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        status: 'error',
        database: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
