import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';
import { AuditService } from '@/services/audit.service';
import { getCurrentUser, canDeletePrompt } from '@/lib/auth-utils';
import { applyRateLimit } from '@/services/rate-limit.service';

/** Deprecation is a privileged mutation; the actor comes only from the session. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = applyRateLimit(request, 'strict');
  if (rateLimitError) return rateLimitError;

  try {
    const actor = await getCurrentUser();
    if (!actor) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (!canDeletePrompt(actor)) {
      return NextResponse.json({ error: 'Sin permisos para deprecar' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : '';

    const existingPrompt = await db.prompt.findUnique({ where: { id } });
    if (!existingPrompt || existingPrompt.deletedAt !== null) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }

    const prompt = await db.prompt.update({
      where: { id },
      data: {
        status: 'deprecated',
        deprecatedAt: new Date(),
        changelog: reason || 'Prompt deprecado',
      },
    });

    await AuditService.log({
      promptId: id,
      userId: actor.id,
      action: 'deprecate',
      details: { reason },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al deprecar prompt');
  }
}
