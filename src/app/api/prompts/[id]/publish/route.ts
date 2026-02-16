import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { AuditService } from '@/services/audit.service';

// POST - Publicar un prompt (cambiar estado a published)
// WO-0003: Validar reviewer antes de crear auditLog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reviewerId } = body;
    
    const existingPrompt = await db.prompt.findUnique({
      where: { id },
    });
    
    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }
    
    if (existingPrompt.status === 'published') {
      return NextResponse.json({ error: 'El prompt ya está publicado' }, { status: 400 });
    }
    
    // Obtener usuario por defecto si no se proporciona
    let reviewer = reviewerId;
    if (!reviewer) {
      const defaultUser = await db.user.findFirst();
      if (defaultUser) {
        reviewer = defaultUser.id;
      }
    }
    
    // WO-0003: Validar que reviewer existe antes de continuar
    if (!reviewer) {
      logger.error('[WO-0003] No hay usuario disponible para auditar la publicación');
      return NextResponse.json(
        { error: 'No hay usuario disponible para auditar la publicación' },
        { status: 500 }
      );
    }

    // Verificar que el reviewer existe en la base de datos
    const reviewerExists = await db.user.findUnique({
      where: { id: reviewer },
    });

    if (!reviewerExists) {
      logger.error(`[WO-0003] El reviewer ${reviewer} no existe en la base de datos`);
      return NextResponse.json(
        { error: 'El usuario revisor no existe' },
        { status: 500 }
      );
    }
    
    const prompt = await db.prompt.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        reviewerId: reviewer,
      },
      include: {
        User_Prompt_authorIdToUser: {
          select: { id: true, name: true, email: true },
        },
        User_Prompt_reviewerIdToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    
    // Crear registro de auditoría
    await AuditService.log({
      promptId: id,
      userId: reviewer,
      action: 'publish',
      details: {
        previousStatus: existingPrompt.status,
        version: existingPrompt.version,
      },
    });
    
    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al publicar prompt');
  }
}
