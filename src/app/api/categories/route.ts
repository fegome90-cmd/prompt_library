import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createErrorResponse } from '@/lib/api-utils';

// GET - Listar todas las categorías
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
    });
    
    // Contar prompts por categoría manualmente (porque category es string en Prompt, no relación)
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await db.prompt.count({
          where: {
            category: category.name,
            status: 'published',
          },
        });
        return {
          ...category,
          promptsCount: count,
        };
      })
    );
    
    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener categorías');
  }
}

// POST - Crear nueva categoría
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color, icon, order } = body;
    
    const category = await db.category.create({
      data: {
        id: randomUUID(),
        name,
        description,
        color,
        icon,
        order: order || 0,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    return createErrorResponse(error, 'Error al crear categoría');
  }
}
