/**
 * AuditService - Centralized audit logging
 *
 * Provides a unified interface for creating audit log entries,
 * eliminating duplicate audit logging code across API routes.
 */

import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import type { PrismaClient } from '@prisma/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'deprecate' | 'feedback';

export interface AuditLogData {
  promptId: string;
  userId: string;
  action: AuditAction;
  details: Record<string, unknown>;
}

/**
 * AuditService handles all audit logging operations
 */
export class AuditService {
  /**
   * Registra una acción de auditoría
   */
  static async log(data: AuditLogData): Promise<void> {
    await db.auditLog.create({
      data: {
        id: randomUUID(),
        promptId: data.promptId,
        userId: data.userId,
        action: data.action,
        details: JSON.stringify(data.details),
      },
    });
  }

  /**
   * Versión para usar dentro de transacciones Prisma
   * Retorna el Prisma promise para ser usado con $transaction
   */
  static logInTransaction(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, data: AuditLogData) {
    return tx.auditLog.create({
      data: {
        id: randomUUID(),
        promptId: data.promptId,
        userId: data.userId,
        action: data.action,
        details: JSON.stringify(data.details),
      },
    });
  }
}
