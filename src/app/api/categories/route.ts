import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createErrorResponse } from '@/lib/api-utils';

// GET - Listar todas las categorías
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            prompts: {
              where: {
                status: 'published',
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    // Transform to include promptsCount
    const categoriesWithCount = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      order: category.order,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      promptsCount: category._count.prompts,
    }));

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
