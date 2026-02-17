/**
 * Prompts API - List and Create
 *
 * SECURITY: Uses NextAuth.js for authentication.
 * Users must be authenticated to create prompts.
 */

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createPromptSchema, formatZodError } from '@/lib/validators/prompt';
import { applyRateLimit } from '@/services/rate-limit.service';
import { AuditService } from '@/services/audit.service';
import { getUserWithDevFallback } from '@/lib/auth-utils';
import { createErrorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET - Listar todos los prompts
// WO-0008: Paginación opcional
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // WO-0008: Parámetros de paginación
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    // Filtros existentes
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const favorites = searchParams.get('favorites') === 'true';

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    } else {
      // Por defecto mostrar solo publicados
      where.status = 'published';
    }

    if (category) {
      // FIX-001: Support both categoryId and categoryName for backward compatibility
      // If category looks like a UUID, use categoryId, otherwise lookup by name
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        where.categoryId = category;
      } else {
        // Lookup category by name to get ID
        const categoryRecord = await db.category.findFirst({
          where: { name: category },
          select: { id: true },
        });
        if (categoryRecord) {
          where.categoryId = categoryRecord.id;
        }
      }
    }

    if (favorites) {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // FIX-003: Exclude soft-deleted prompts
    where.deletedAt = null;

    // WO-0008: Si hay paginación, usar formato paginado
    if (pageParam || limitParam) {
      const page = parseInt(pageParam || '1');
      const limit = Math.min(parseInt(limitParam || '20'), 100); // Max 100
      const skip = (page - 1) * limit;

      const [prompts, total] = await Promise.all([
        db.prompt.findMany({
          where,
          skip,
          take: limit,
          include: {
            User_Prompt_authorIdToUser: {
              select: { id: true, name: true, email: true },
            },
            category: true,
          },
          orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
        }),
        db.prompt.count({ where }),
      ]);

      return NextResponse.json({
        data: prompts,
        total,
        page,
        limit,
        hasMore: skip + prompts.length < total,
      });
    }

    // Sin paginación - backward compatible (retorna array plano)
    const prompts = await db.prompt.findMany({
      where,
      include: {
        User_Prompt_authorIdToUser: {
          select: { id: true, name: true, email: true },
        },
        category: true,
      },
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(prompts);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener prompts');
  }
}

// POST - Crear nuevo prompt
// WO-0005: Validación con Zod
export async function POST(request: NextRequest) {
  // SECURITY: Rate limiting
  const rateLimitError = applyRateLimit(request, 'standard');
  if (rateLimitError) return rateLimitError;

  try {
    // SECURITY: Get authenticated user (with dev fallback in development)
    const currentUser = await getUserWithDevFallback();

    // TEMPORARY DIAGNOSTICS (WO-0016): Log auth state for debugging
    // TODO: Remove this after debugging WO-0016
    if (process.env.NODE_ENV === 'development') {
      logger.info('[WO-0016] Auth diagnostics', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        nodeEnv: process.env.NODE_ENV,
        hasDevBypass: process.env.DEV_AUTH_BYPASS === 'true',
      });
    }

    if (!currentUser) {
      logger.warn('[SECURITY] No hay usuario autenticado para operación POST');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación con Zod
    const validation = createPromptSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('[WO-0005] Validación fallida', { issues: validation.error.issues });
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const data = validation.data;

    // Use authenticated user as author
    const authorId = currentUser.id;

    // FIX-001: Resolve categoryId from category name
    const categoryRecord = await db.category.findFirst({
      where: { name: data.category },
      select: { id: true },
    });

    if (!categoryRecord) {
      return NextResponse.json(
        { error: `Category '${data.category}' not found` },
        { status: 400 }
      );
    }

    const prompt = await db.prompt.create({
      data: {
        id: randomUUID(),
        title: data.title,
        description: data.description,
        body: data.body,
        categoryId: categoryRecord.id,
        tags: data.tags,
        variablesSchema: data.variablesSchema,
        outputFormat: data.outputFormat,
        examples: data.examples,
        riskLevel: data.riskLevel,
        status: 'draft',
        authorId: authorId,
        updatedAt: new Date(),
      },
      include: {
        User_Prompt_authorIdToUser: {
          select: { id: true, name: true, email: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
    });

    // Crear registro de auditoría
    await AuditService.log({
      promptId: prompt.id,
      userId: authorId,
      action: 'create',
      details: { title: data.title, category: data.category },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al crear prompt');
  }
}
