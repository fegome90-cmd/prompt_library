import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';
import { AuditService } from '@/services/audit.service';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';
import { applyRateLimit } from '@/services/rate-limit.service';

/** Publish requires a real session with an owner/editor or an assigned reviewer. */
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

    const { id } = await params;
    const existingPrompt = await db.prompt.findUnique({ where: { id } });
    if (!existingPrompt || existingPrompt.deletedAt !== null) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }

    const canPublish =
      hasRole(actor, ['owner', 'editor']) ||
      (actor.role === 'reviewer' && existingPrompt.reviewerId === actor.id);
    if (!canPublish) {
      return NextResponse.json({ error: 'Sin permisos para publicar' }, { status: 403 });
    }

    if (existingPrompt.status === 'published') {
      return NextResponse.json({ error: 'El prompt ya está publicado' }, { status: 400 });
    }

    // Never accept reviewer identity from the request body.
    const prompt = await db.prompt.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        reviewerId: actor.id,
      },
      include: {
        User_Prompt_authorIdToUser: { select: { id: true, name: true } },
        User_Prompt_reviewerIdToUser: { select: { id: true, name: true } },
      },
    });

    await AuditService.log({
      promptId: id,
      userId: actor.id,
      action: 'publish',
      details: { previousStatus: existingPrompt.status, version: existingPrompt.version },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    return createErrorResponse(error, 'Error al publicar prompt');
  }
}
