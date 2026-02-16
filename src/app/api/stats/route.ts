import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';

// GET - Obtener estadísticas generales
export async function GET() {
  try {
    // Conteos básicos
    const [
      totalPrompts,
      publishedPrompts,
      draftPrompts,
      reviewPrompts,
      deprecatedPrompts,
      totalCategories,
      totalUsage,
      totalThumbsUp,
      totalThumbsDown,
    ] = await Promise.all([
      db.prompt.count(),
      db.prompt.count({ where: { status: 'published' } }),
      db.prompt.count({ where: { status: 'draft' } }),
      db.prompt.count({ where: { status: 'review' } }),
      db.prompt.count({ where: { status: 'deprecated' } }),
      db.category.count(),
      db.promptUsage.count(),
      db.promptUsage.count({ where: { feedback: 'thumbs_up' } }),
      db.promptUsage.count({ where: { feedback: 'thumbs_down' } }),
    ]);
    
    // Prompts más usados
    const topPrompts = await db.prompt.findMany({
      where: { status: 'published' },
      orderBy: { useCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        useCount: true,
        thumbsUp: true,
        thumbsDown: true,
      },
    });
    
    // Prompts con mejor rating
    const bestRatedPrompts = await db.prompt.findMany({
      where: {
        status: 'published',
        useCount: { gte: 3 }, // Al menos 3 usos para tener rating significativo
      },
      orderBy: {
        thumbsUp: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        useCount: true,
        thumbsUp: true,
        thumbsDown: true,
      },
    });
    
    // Prompts problemáticos (bajo rating)
    const problematicPrompts = await db.prompt.findMany({
      where: {
        status: 'published',
        useCount: { gte: 3 },
        thumbsDown: { gte: 2 },
      },
      orderBy: {
        thumbsDown: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        useCount: true,
        thumbsUp: true,
        thumbsDown: true,
      },
    });
    
    // Uso por categoría
    const categories = await db.category.findMany({
      orderBy: { order: 'asc' },
    });

    const usageByCategory = await Promise.all(
      categories.map(async (cat) => {
        const count = await db.prompt.count({
          where: { categoryId: cat.id, status: 'published', deletedAt: null },
        });
        const uses = await db.prompt.aggregate({
          where: { categoryId: cat.id, status: 'published', deletedAt: null },
          _sum: { useCount: true },
        });
        return {
          category: cat.name,
          color: cat.color,
          promptsCount: count,
          totalUses: uses._sum.useCount ?? 0,
        };
      })
    );
    
    // Calcular rating promedio
    const totalFeedback = totalThumbsUp + totalThumbsDown;
    const avgRating = totalFeedback > 0 
      ? Math.round((totalThumbsUp / totalFeedback) * 100) 
      : 0;
    
    // Uso reciente (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsage = await db.promptUsage.count({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    });
    
    return NextResponse.json({
      overview: {
        totalPrompts,
        publishedPrompts,
        draftPrompts,
        reviewPrompts,
        deprecatedPrompts,
        totalCategories,
        totalUsage,
        totalThumbsUp,
        totalThumbsDown,
        avgRating,
        recentUsage,
      },
      topPrompts,
      bestRatedPrompts,
      problematicPrompts,
      usageByCategory,
    });
  } catch (error) {
    return createErrorResponse(error, 'Error al obtener estadísticas');
  }
}
