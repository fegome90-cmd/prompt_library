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
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_PRESETS,
  createRateLimitResponse,
} from '@/lib/rate-limit';
import { getUserWithDevFallback } from '@/lib/auth-utils';
import { createErrorResponse } from '@/lib/api-utils';

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
      where.category = category;
    }

    if (favorites) {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

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
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, RATE_LIMIT_PRESETS.standard);
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit) as NextResponse;
  }

  try {
    // SECURITY: Get authenticated user (with dev fallback in development)
    const currentUser = await getUserWithDevFallback();

    if (!currentUser) {
      console.warn('[SECURITY] No hay usuario autenticado para operación POST');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación con Zod
    const validation = createPromptSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[WO-0005] Validación fallida:', validation.error.issues);
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const data = validation.data;

    // Use authenticated user as author
    const authorId = currentUser.id;

    const prompt = await db.prompt.create({
      data: {
        id: randomUUID(),
        title: data.title,
        description: data.description,
        body: data.body,
        category: data.category,
        tags: JSON.stringify(data.tags),
        variablesSchema: JSON.stringify(data.variablesSchema),
        outputFormat: data.outputFormat,
        examples: JSON.stringify(data.examples),
        riskLevel: data.riskLevel,
        status: 'draft',
        authorId: authorId,
        updatedAt: new Date(),
      },
      include: {
        User_Prompt_authorIdToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Crear registro de auditoría
    await db.auditLog.create({
      data: {
        id: randomUUID(),
        promptId: prompt.id,
        userId: authorId,
        action: 'create',
        details: JSON.stringify({ title: data.title, category: data.category }),
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al crear prompt');
  }
}
