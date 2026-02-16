import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';
import { AuditService } from '@/services/audit.service';

// POST - Deprecar un prompt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, userId } = body;
    
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
    
    const prompt = await db.prompt.update({
      where: { id },
      data: {
        status: 'deprecated',
        deprecatedAt: new Date(),
        changelog: reason || 'Prompt deprecado',
      },
    });
    
    // Crear registro de auditoría
    await AuditService.log({
      promptId: id,
      userId: user,
      action: 'deprecate',
      details: { reason },
    });
    
    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al deprecar prompt');
  }
}
