import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createErrorResponse } from '@/lib/api-utils';
import { AuditService } from '@/services/audit.service';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { applyRateLimit } from '@/services/rate-limit.service';
import { feedbackSchema } from '@/lib/validators/prompt';

/**
 * POST - Registrar uso y feedback de un prompt
 * 
 * WO-0002: Usando transacción atómica para evitar race conditions
 * SECURITY: Deduplicación de feedback por usuario/prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = applyRateLimit(request, 'standard');
  if (rateLimitError) return rateLimitError;

  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const rawBody = await request.json();
    if (rawBody && typeof rawBody === 'object' && 'userId' in rawBody) {
      return NextResponse.json({ error: 'userId must come from the session' }, { status: 400 });
    }
    const parsed = feedbackSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const { feedback, comment, dataRiskLevel, variablesUsed } = parsed.data;
    // Record names of variables, not their values (which may contain personal data).
    const safeVariableSummary = JSON.stringify({ names: Object.keys(variablesUsed ?? {}) });
    
    const existingPrompt = await db.prompt.findUnique({
      where: { id },
    });
    
    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }
    
    const finalUserId = actor.id;

    // SECURITY: Verificar si el usuario ya dio feedback para este prompt
    const existingFeedback = await db.promptUsage.findFirst({
      where: {
        promptId: id,
        userId: finalUserId,
        feedback: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Si ya existe feedback, actualizar en lugar de crear nuevo
    if (existingFeedback && existingFeedback.feedback) {
      // Solo permitir cambiar el feedback, no duplicar
      const result = await db.$transaction(async (tx) => {
        // Actualizar el registro existente
        const updatedUsage = await tx.promptUsage.update({
          where: { id: existingFeedback.id },
          data: {
            feedback,
            comment: comment?.substring(0, 200),
            dataRiskLevel,
            variablesUsed: safeVariableSummary,
          },
        });
        
        // Ajustar contadores si cambió el feedback
        if (existingFeedback.feedback !== feedback) {
          const updateData: Record<string, unknown> = {};
          
          // Decrementar el contador anterior
          if (existingFeedback.feedback === 'thumbs_up') {
            updateData.thumbsUp = { decrement: 1 };
          } else if (existingFeedback.feedback === 'thumbs_down') {
            updateData.thumbsDown = { decrement: 1 };
          }
          
          // Incrementar el nuevo contador
          if (feedback === 'thumbs_up') {
            updateData.thumbsUp = { increment: 1 };
          } else if (feedback === 'thumbs_down') {
            updateData.thumbsDown = { increment: 1 };
          }
          
          if (Object.keys(updateData).length > 0) {
            await tx.prompt.update({
              where: { id },
              data: updateData,
            });
          }
        }
        
        return updatedUsage;
      });
      
      return NextResponse.json({
        ...result,
        _meta: { updated: true, previousFeedback: existingFeedback.feedback }
      });
    }
    
    // WO-0002: Ejecutar todas las operaciones en una transacción atómica
    const result = await db.$transaction(async (tx) => {
      // 1. Registrar el uso
      const usageEvent = await tx.promptUsage.create({
        data: {
          id: randomUUID(),
          promptId: id,
          userId: finalUserId,
          feedback,
          comment: comment?.substring(0, 200), // Máximo 200 caracteres
          dataRiskLevel,
          variablesUsed: safeVariableSummary,
        },
      });
      
      // 2. Actualizar contadores del prompt (atómico)
      const updateData: Record<string, unknown> = {
        useCount: { increment: 1 },
      };
      
      if (feedback === 'thumbs_up') {
        updateData.thumbsUp = { increment: 1 };
      } else if (feedback === 'thumbs_down') {
        updateData.thumbsDown = { increment: 1 };
      }
      
      await tx.prompt.update({
        where: { id },
        data: updateData,
      });
      
      // 3. Crear registro de auditoría
      await AuditService.logInTransaction(tx, {
        promptId: id,
        userId: finalUserId,
        action: 'feedback',
        details: { feedback, comment, dataRiskLevel },
      });
      
      return usageEvent;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error, 'Error al registrar feedback');
  }
}

// GET - Usage history is private: users see their own records, owners/editors see all.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const isPrivileged = hasRole(actor, ['owner', 'editor']);
    const usageEvents = await db.promptUsage.findMany({
      where: {
        promptId: id,
        ...(isPrivileged ? {} : { userId: actor.id }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      // Avoid exposing other users' emails or credentials.
    });
    return NextResponse.json(usageEvents);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener historial');
  }
}
