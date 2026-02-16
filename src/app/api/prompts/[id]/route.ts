/**
 * Prompt API - CRUD Operations
 *
 * SECURITY: This endpoint uses NextAuth.js for authentication.
 * Users must be authenticated to modify prompts.
 *
 * Role-based permissions:
 * - owner: can modify/delete all prompts
 * - editor: can modify/delete all prompts
 * - reviewer: can modify prompts (assigned or own)
 * - user: can only modify their own prompts, cannot delete
 */

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { updatePromptSchema, formatZodError } from '@/lib/validators/prompt';
import { applyRateLimit } from '@/services/rate-limit.service';
import { AuditService } from '@/services/audit.service';
import {
  getUserWithDevFallback,
  canModifyPrompt,
  canDeletePrompt,
} from '@/lib/auth-utils';
import { createErrorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// WO-0009: Función de validación de versión
function isValidVersion(version: string): boolean {
  // Formato: X, X.Y, o X.Y.Z donde X, Y, Z son números
  return /^\d+(\.\d+)*$/.test(version);
}

// WO-0009: Función de incremento de versión
function incrementVersion(version: string): string {
  if (!isValidVersion(version)) {
    logger.warn(`[WO-0009] Versión inválida "${version}", reseteando a 1.0`);
    return '1.0';
  }

  const parts = version.split('.');
  const major = parts[0] || '1';
  const minor = parseInt(parts[1] || '0') + 1;
  return `${major}.${minor}`;
}

// GET - Obtener un prompt específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const prompt = await db.prompt.findUnique({
      where: { id },
      include: {
        User_Prompt_authorIdToUser: {
          select: { id: true, name: true, email: true },
        },
        User_Prompt_reviewerIdToUser: {
          select: { id: true, name: true, email: true },
        },
        PromptVersion: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener prompt');
  }
}

// PUT - Actualizar un prompt
// WO-0001: Ownership validation
// WO-0005: Zod validation
// WO-0009: Version parsing fix
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Rate limiting
  const rateLimitError = applyRateLimit(request, 'standard');
  if (rateLimitError) return rateLimitError;

  try {
    // SECURITY: Get authenticated user (with dev fallback in development)
    const currentUser = await getUserWithDevFallback();

    if (!currentUser) {
      logger.warn('[SECURITY] No hay usuario autenticado para operación PUT');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // WO-0005: Validación con Zod
    const validation = updatePromptSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('[WO-0005] Validación fallida', { issues: validation.error.issues });
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      );
    }

    const data = validation.data;

    const existingPrompt = await db.prompt.findUnique({
      where: { id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }

    // SECURITY: Validación de permisos con roles
    if (!canModifyPrompt(currentUser, existingPrompt.authorId)) {
      logger.warn(
        `[SECURITY] Usuario ${currentUser.id} (${currentUser.role}) intentó modificar prompt de otro usuario`
      );
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este prompt' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      body: promptBody,
      category,
      tags,
      variablesSchema,
      outputFormat,
      examples,
      riskLevel,
      changelog,
      isFavorite,
    } = data;

    // Si hay cambios significativos, crear una versión anterior
    const shouldVersion = promptBody && promptBody !== existingPrompt.body;

    if (shouldVersion) {
      await db.promptVersion.create({
        data: {
          id: randomUUID(),
          promptId: id,
          version: existingPrompt.version,
          body: existingPrompt.body,
          variablesSchema: existingPrompt.variablesSchema ?? [],
          outputFormat: existingPrompt.outputFormat,
          changelog: changelog || 'Actualización',
          authorId: existingPrompt.authorId,
        },
      });
    }

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (promptBody !== undefined) updateData.body = promptBody;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (variablesSchema !== undefined) updateData.variablesSchema = variablesSchema;
    if (outputFormat !== undefined) updateData.outputFormat = outputFormat;
    if (examples !== undefined) updateData.examples = examples;
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (changelog !== undefined) updateData.changelog = changelog;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    // WO-0009: Incrementar versión con validación
    if (shouldVersion) {
      updateData.version = incrementVersion(existingPrompt.version);
    }

    const prompt = await db.prompt.update({
      where: { id },
      data: updateData,
      include: {
        User_Prompt_authorIdToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Crear registro de auditoría
    await AuditService.log({
      promptId: id,
      userId: currentUser.id,
      action: 'update',
      details: { changes: Object.keys(updateData), changelog },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al actualizar prompt');
  }
}

// DELETE - Eliminar un prompt
// WO-0001: Ownership validation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // SECURITY: Rate limiting (strict for destructive operations)
  const rateLimitError = applyRateLimit(request, 'strict');
  if (rateLimitError) return rateLimitError;

  try {
    // SECURITY: Get authenticated user (with dev fallback in development)
    const currentUser = await getUserWithDevFallback();

    if (!currentUser) {
      logger.warn('[SECURITY] No hay usuario autenticado para operación DELETE');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existingPrompt = await db.prompt.findUnique({
      where: { id },
    });

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }

    // SECURITY: Only owners and editors can delete
    if (!canDeletePrompt(currentUser)) {
      logger.warn(
        `[SECURITY] Usuario ${currentUser.id} (${currentUser.role}) intentó eliminar prompt - rol insuficiente`
      );
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar prompts' },
        { status: 403 }
      );
    }

    // Soft delete: marcar como deprecated
    await db.prompt.update({
      where: { id },
      data: {
        status: 'deprecated',
        deprecatedAt: new Date(),
      },
    });

    // Crear registro de auditoría
    await AuditService.log({
      promptId: id,
      userId: currentUser.id,
      action: 'delete',
      details: { title: existingPrompt.title },
    });

    return NextResponse.json({ success: true, message: 'Prompt marcado como deprecado' });
  } catch (error) {
    return createErrorResponse(error, 'Error al eliminar prompt');
  }
}
