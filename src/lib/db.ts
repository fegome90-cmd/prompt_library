import { PrismaClient } from '@prisma/client'

/**
 * PrismaClient singleton - evita connection pool exhaustion
 * 
 * CRITICAL: No invalidar globalForPrisma.prisma en desarrollo.
 * Next.js hot-reload preserva el global, y Prisma maneja su propio pool.
 * 
 * Si se necesitan fresh queries, usar $disconnect() explícitamente.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db