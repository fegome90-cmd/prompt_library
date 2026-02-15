import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createErrorResponse } from '@/lib/api-utils';

// GET - Obtener usuario por defecto (simplificado sin auth)
export async function GET() {
  try {
    let user = await db.user.findFirst({
      where: { email: 'admin@empresa.com' },
    });
    
    // Crear usuario por defecto si no existe
    if (!user) {
      user = await db.user.create({
        data: {
          id: randomUUID(),
          email: 'admin@empresa.com',
          name: 'Administrador',
          role: 'owner',
          updatedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener usuario');
  }
}
