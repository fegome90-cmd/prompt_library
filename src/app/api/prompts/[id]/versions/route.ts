import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';

// GET - Obtener versiones de un prompt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
