import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';
import { getCurrentUser, hasRole } from '@/lib/auth-utils';

// Historical versions are not public, even when the current prompt is published.
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
    const prompt = await db.prompt.findUnique({
      where: { id },
      select: { authorId: true, reviewerId: true, deletedAt: true },
    });
    if (!prompt || prompt.deletedAt !== null) {
      return NextResponse.json({ error: 'Prompt no encontrado' }, { status: 404 });
    }

    const authorized =
      hasRole(actor, ['owner', 'editor']) ||
      actor.id === prompt.authorId ||
      actor.id === prompt.reviewerId;
    if (!authorized) {
      return NextResponse.json({ error: 'Sin permisos para ver versiones' }, { status: 403 });
    }

    const versions = await db.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(versions);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener versiones');
  }
}
