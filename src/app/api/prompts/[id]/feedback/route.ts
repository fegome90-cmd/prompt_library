import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createErrorResponse } from '@/lib/api-utils';

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
  try {
    const { id } = await params;
    const body = await request.json();
    const { feedback, comment, dataRiskLevel, variablesUsed, userId } = body;
    
    const existingPrompt = await db.prompt.findUnique({
      where: { id },
    });
    
    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }
    
    // Obtener usuario por defecto si no se proporciona
    let user = userId;
    if (!user) {
      const defaultUser = await db.user.findFirst();
      if (defaultUser) {
        user = defaultUser.id;
      }
    }
    
    // Validar que tenemos un usuario
    if (!user) {
      return NextResponse.json({ error: 'No hay usuario disponible' }, { status: 500 });
    }
    
    const finalUserId = user; // Para usar dentro de la transacción
    
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
            variablesUsed: JSON.stringify(variablesUsed || {}),
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
          variablesUsed: JSON.stringify(variablesUsed || {}),
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
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          promptId: id,
          userId: finalUserId,
          action: 'feedback',
          details: JSON.stringify({ feedback, comment, dataRiskLevel }),
        },
      });
      
      return usageEvent;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error, 'Error al registrar feedback');
  }
}

// GET - Obtener historial de uso y feedback
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const usageEvents = await db.promptUsage.findMany({
      where: { promptId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    return NextResponse.json(usageEvents);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener historial');
  }
}
